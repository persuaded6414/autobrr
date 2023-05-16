// Copyright (c) 2021 - 2023, Ludvig Lundgren and the autobrr contributors.
// SPDX-License-Identifier: GPL-2.0-or-later

package main

import (
	"bufio"
	"context"
	"database/sql"
	"encoding/json"
	"flag"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/autobrr/autobrr/internal/config"
	"github.com/autobrr/autobrr/internal/database"
	"github.com/autobrr/autobrr/internal/domain"
	"github.com/autobrr/autobrr/internal/logger"
	"github.com/autobrr/autobrr/pkg/argon2id"
	"github.com/autobrr/autobrr/pkg/errors"

	_ "github.com/lib/pq"
	_ "github.com/mattn/go-sqlite3"
	"golang.org/x/term"
)

const usage = `usage: autobrrctl <action> [arguments]

Actions:
  create-user         <username>                      Create a new user
  change-password     <username>                      Change the password
  db:seed             <path-to-database> <seed-path>  Seed the sqlite database
  db:reset            <path-to-database> <seed-path>  Reset the sqlite database
  db:migrate             <sqliteDBPath> <postgresDBURL>  Migrate sqlite to postgres
  version                                             Display the version of autobrrctl
  help                                                Show this help message

Examples:
  autobrrctl --config /config.toml create-user john
  autobrrctl --config /config.toml change-password john
  autobrrctl db:reset /path/to/sqlite.db /path/to/seed
  autobrrctl db:seed /path/to/sqlite.db /path/to/seed
  autobrrctl db:migrate /path/to/sqlite.db postgresql://localhost/mydb
  autobrrctl version
  autobrrctl help
`

var (
	version = "dev"
	commit  = ""
	date    = ""

	owner = "autobrr"
	repo  = "autobrr"
)

func init() {
	flag.Usage = func() {
		fmt.Fprint(flag.CommandLine.Output(), usage)
	}
}

func migrate(sqliteDBPath, postgresDBURL string) {
	// Connect to SQLite database
	sqliteDB, err := sql.Open("sqlite3", sqliteDBPath)
	if err != nil {
		log.Fatalf("Failed to connect to SQLite database: %v", err)
	}
	defer sqliteDB.Close()

	// Connect to PostgreSQL database
	postgresDB, err := sql.Open("postgres", postgresDBURL)
	if err != nil {
		log.Fatalf("Failed to connect to PostgreSQL database: %v", err)
	}
	defer postgresDB.Close()

	tables := []string{
		"users", "indexer", "irc_network", "irc_channel", "client", "filter", "action", "notification", "filter_indexer", "release", "release_action_status", "feed", "api_key",
	}

	for _, table := range tables {
		// Get all rows from the SQLite table
		rows, err := sqliteDB.Query(fmt.Sprintf("SELECT * FROM %s", table))
		if err != nil {
			log.Fatalf("Failed to query SQLite table '%s': %v", table, err)
		}

		// Get column names and types
		columns, err := rows.ColumnTypes()
		if err != nil {
			log.Fatalf("Failed to get column types for table '%s': %v", table, err)
		}

		// Prepare an INSERT statement for the PostgreSQL table
		colNames := ""
		colPlaceholders := ""
		for i, col := range columns {
			colNames += col.Name()
			colPlaceholders += fmt.Sprintf("$%d", i+1)
			if i < len(columns)-1 {
				colNames += ", "
				colPlaceholders += ", "
			}
		}

		// Start a new transaction before the insert operation
		tx, err := postgresDB.Begin()
		if err != nil {
			log.Fatalf("Failed to begin a transaction: %v", err)
		}

		defer func() {
			if err := tx.Rollback(); err != nil && err != sql.ErrTxDone {
				log.Fatalf("Failed to rollback: %v", err)
			}
		}()

		// Iterate through SQLite rows and insert them into the PostgreSQL table
		for rows.Next() {
			values := make([]interface{}, len(columns))
			valuePtrs := make([]interface{}, len(columns))
			for i := range values {
				valuePtrs[i] = &values[i]
			}

			err = rows.Scan(valuePtrs...)
			if err != nil {
				log.Fatalf("Failed to scan row from SQLite table '%s': %v", table, err)
			}

			insertStmt, err := tx.Prepare(fmt.Sprintf("INSERT INTO %s (%s) VALUES (%s)", table, colNames, colPlaceholders))
			if err != nil {
				log.Fatalf("Failed to prepare INSERT statement for table '%s': %v", table, err)
			}

			_, err = insertStmt.Exec(values...)
			if err != nil {
				if strings.Contains(err.Error(), "violates foreign key constraint") {
					log.Printf("Failed to insert the following values into PostgreSQL table '%s': %v", table, values)
					log.Printf("Skipping row due to foreign key constraint violation: %v", err)
					tx.Rollback() // rollback the current transaction

					// Start a new transaction
					tx, err = postgresDB.Begin()
					if err != nil {
						log.Fatalf("Failed to begin a transaction: %v", err)
					}
				} else {
					log.Fatalf("Failed to insert row into PostgreSQL table '%s': %v", table, err)
				}
			}

		}
		// Commit the transaction after the insert operations
		err = tx.Commit()
		if err != nil {
			log.Fatalf("Failed to commit the transaction: %v", err)
		}

		fmt.Printf("Migrated table '%s' from SQLite to PostgreSQL\n", table)
	}

	fmt.Println("Migration completed successfully!")
}

func resetDB(dbPath string) {
	// Open the existing SQLite database
	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		log.Fatalf("failed to open database: %v", err)
	}
	defer db.Close()

	// Start a new transaction
	tx, err := db.Begin()
	if err != nil {
		log.Fatalf("failed to begin transaction: %v", err)
	}

	// Update the tables list with the provided table names
	tables := []string{
		"action",
		"api_key",
		"client",
		"feed",
		"feed_cache",
		"filter",
		"filter_indexer",
		"indexer",
		"irc_channel",
		"irc_network",
		"notification",
		"release",
		"release_action_status",
		"users",
	}

	// Execute SQL commands to remove all rows and reset primary key sequences
	for _, table := range tables {
		_, err = tx.Exec(fmt.Sprintf("DELETE FROM %s", table))
		if err != nil {
			log.Printf("failed to delete rows from table %s: %v", table, err)
			tx.Rollback()
			return
		}

		// Attempt to update sqlite_sequence, ignore errors caused by missing sqlite_sequence entry
		_, err = tx.Exec(fmt.Sprintf("UPDATE sqlite_sequence SET seq = 0 WHERE name = '%s'", table))
		if err != nil && !strings.Contains(err.Error(), "no such table") {
			log.Printf("failed to reset primary key sequence for table %s: %v", table, err)
			tx.Rollback()
			return
		}
	}

	// Commit the transaction
	err = tx.Commit()
	if err != nil {
		log.Fatalf("failed to commit transaction: %v", err)
	}
}

func seedDB(seedDBPath, dbPath string) {
	// Read SQL file
	sqlFile, err := ioutil.ReadFile(seedDBPath)
	if err != nil {
		log.Fatalf("failed to read SQL file: %v", err)
	}

	// Open the SQLite database
	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		log.Fatalf("failed to open database: %v", err)
	}
	defer db.Close()

	// Start a new transaction
	tx, err := db.Begin()
	if err != nil {
		log.Fatalf("failed to begin transaction: %v", err)
	}

	// Execute SQL commands from the file
	sqlCommands := strings.Split(string(sqlFile), ";")
	for _, cmd := range sqlCommands {
		_, err = tx.Exec(cmd)
		if err != nil {
			log.Printf("failed to execute SQL command: %v", err)
			tx.Rollback()
			return
		}
	}

	// Commit the transaction
	err = tx.Commit()
	if err != nil {
		log.Fatalf("failed to commit transaction: %v", err)
	}
}

func main() {
	var seedDBPath string
	flag.StringVar(&seedDBPath, "seed-db", "", "path to SQL seed file")

	var configPath string
	flag.StringVar(&configPath, "config", "", "path to configuration file")
	flag.Parse()

	switch cmd := flag.Arg(0); cmd {

	case "db:migrate":
		sqliteDBPath := flag.Arg(1)
		postgresDBURL := flag.Arg(2)

		if sqliteDBPath == "" || postgresDBURL == "" {
			flag.Usage()
			os.Exit(1)
		}

		migrate(sqliteDBPath, postgresDBURL)

	case "db:seed":
		seedDBPath := flag.Arg(1)
		if seedDBPath == "" {
			fmt.Println("Error: missing path to SQL seed file")
			flag.Usage()
			os.Exit(1)
		}

		dbPath := flag.Arg(2)
		if dbPath == "" {
			fmt.Println("Error: missing path to SQLite database file")
			flag.Usage()
			os.Exit(1)
		}

		seedDB(seedDBPath, dbPath)
		fmt.Println("Database seeding completed successfully!")

	case "db:reset":
		seedDBPath := flag.Arg(1)
		if seedDBPath == "" {
			fmt.Println("Error: missing path to SQL seed file")
			flag.Usage()
			os.Exit(1)
		}

		dbPath := flag.Arg(2)
		if dbPath == "" {
			fmt.Println("Error: missing path to SQLite database file")
			flag.Usage()
			os.Exit(1)
		}

		resetDB(dbPath)
		seedDB(seedDBPath, dbPath)
		fmt.Println("Database reset completed successfully!")

	case "version":
		fmt.Printf("Version: %v\nCommit: %v\nBuild: %v\n", version, commit, date)

		// get the latest release tag from brr-api
		client := &http.Client{
			Timeout: 10 * time.Second,
		}

		resp, err := client.Get(fmt.Sprintf("https://api.autobrr.com/repos/%s/%s/releases/latest", owner, repo))
		if err != nil {
			if errors.Is(err, http.ErrHandlerTimeout) {
				fmt.Println("Server timed out while fetching latest release from api")
			} else {
				fmt.Printf("Failed to fetch latest release from api: %v\n", err)
			}
			os.Exit(1)
		}
		defer resp.Body.Close()

		// brr-api returns 500 instead of 404 here
		if resp.StatusCode == http.StatusNotFound || resp.StatusCode == http.StatusInternalServerError {
			fmt.Printf("No release found for %s/%s\n", owner, repo)
			os.Exit(1)
		}

		var rel struct {
			TagName string `json:"tag_name"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&rel); err != nil {
			fmt.Printf("Failed to decode response from api: %v\n", err)
			os.Exit(1)
		}
		fmt.Printf("Latest release: %v\n", rel.TagName)

	case "create-user":

		if configPath == "" {
			log.Fatal("--config required")
		}

		// read config
		cfg := config.New(configPath, version)

		// init new logger
		l := logger.New(cfg.Config)

		// open database connection
		db, _ := database.NewDB(cfg.Config, l)
		if err := db.Open(); err != nil {
			log.Fatal("could not open db connection")
		}

		userRepo := database.NewUserRepo(l, db)

		username := flag.Arg(1)
		if username == "" {
			flag.Usage()
			os.Exit(1)
		}

		password, err := readPassword()
		if err != nil {
			log.Fatalf("failed to read password: %v", err)
		}
		hashed, err := argon2id.CreateHash(string(password), argon2id.DefaultParams)
		if err != nil {
			log.Fatalf("failed to hash password: %v", err)
		}

		user := domain.CreateUserRequest{
			Username: username,
			Password: hashed,
		}
		if err := userRepo.Store(context.Background(), user); err != nil {
			log.Fatalf("failed to create user: %v", err)
		}
	case "change-password":

		if configPath == "" {
			log.Fatal("--config required")
		}

		// read config
		cfg := config.New(configPath, version)

		// init new logger
		l := logger.New(cfg.Config)

		// open database connection
		db, _ := database.NewDB(cfg.Config, l)
		if err := db.Open(); err != nil {
			log.Fatal("could not open db connection")
		}

		userRepo := database.NewUserRepo(l, db)

		username := flag.Arg(1)
		if username == "" {
			flag.Usage()
			os.Exit(1)
		}

		user, err := userRepo.FindByUsername(context.Background(), username)
		if err != nil {
			log.Fatalf("failed to get user: %v", err)
		}

		if user == nil {
			log.Fatalf("failed to get user: %v", err)
		}

		password, err := readPassword()
		if err != nil {
			log.Fatalf("failed to read password: %v", err)
		}
		hashed, err := argon2id.CreateHash(string(password), argon2id.DefaultParams)
		if err != nil {
			log.Fatalf("failed to hash password: %v", err)
		}

		user.Password = hashed
		if err := userRepo.Update(context.Background(), *user); err != nil {
			log.Fatalf("failed to create user: %v", err)
		}
	default:
		flag.Usage()
		if cmd != "help" {
			os.Exit(1)
		}
	}
}

func readPassword() ([]byte, error) {
	var password []byte
	var err error
	fd := int(os.Stdin.Fd())

	if term.IsTerminal(fd) {
		fmt.Printf("Password: ")
		password, err = term.ReadPassword(int(os.Stdin.Fd()))
		if err != nil {
			return nil, err
		}
		fmt.Printf("\n")
	} else {
		//fmt.Fprintf(os.Stderr, "warning: Reading password from stdin.\n")
		scanner := bufio.NewScanner(os.Stdin)
		if !scanner.Scan() {
			if err := scanner.Err(); err != nil {
				log.Fatalf("failed to read password from stdin: %v", err)
			}
			log.Fatalf("failed to read password from stdin: stdin is empty %v", err)
		}
		password = scanner.Bytes()

		if len(password) == 0 {
			return nil, errors.New("zero length password")
		}
	}

	return password, nil
}
