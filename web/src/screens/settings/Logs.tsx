/*
 * Copyright (c) 2021 - 2023, Ludvig Lundgren and the autobrr contributors.
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import Select, { components, ControlProps, InputProps, MenuProps, OptionProps } from "react-select";

import { LogFiles } from "@screens/Logs";
import { APIClient } from "@api/APIClient";
import { GithubRelease } from "@app/types/Update";
import Toast from "@components/notifications/Toast";
import { LogLevelOptions, SelectOption } from "@domain/constants";

import { Section, RowItem } from "./_components";
import { classNames } from "@utils";
import { Link } from "react-router-dom";

const Input = (props: InputProps) => (
  <components.Input
    {...props}
    inputClassName="outline-none border-none shadow-none focus:ring-transparent"
    className="text-gray-400 dark:text-gray-100"
    children={props.children}
  />
);

const Control = (props: ControlProps) => (
  <components.Control
    {...props}
    className="p-1 block w-full !bg-gray-100 dark:!bg-gray-850 border border-gray-300 dark:border-gray-750 hover:border-gray-400 hover:dark:border-gray-650 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:text-gray-100 sm:text-sm"
    children={props.children}
  />
);

const Menu = (props: MenuProps) => (
  <components.Menu
    {...props}
    className="bg-gray-700 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 dark:text-gray-400 rounded-md shadow-sm"
    children={props.children}
  />
);

const Option = (props: OptionProps) => (
  <components.Option
    {...props}
    className={classNames(
      "transition dark:hover:bg-gray-900 dark:focus:bg-gray-900",
      props.isSelected ? "dark:bg-gray-875 dark:text-gray-200" : "dark:bg-gray-800 dark:text-gray-400"
    )}
    children={props.children}
  />
);

type SelectWrapperProps = {
  id: string;
  value: unknown;
  onChange: any;
  options: unknown[];
}

const SelectWrapper = ({ id, value, onChange, options }: SelectWrapperProps) => (
  <Select
    id={id}
    components={{ Input, Control, Menu, Option }}
    placeholder="Choose a type"
    styles={{
      singleValue: (base) => ({
        ...base,
        color: "unset"
      })
    }}
    theme={(theme) => ({
      ...theme,
      spacing: {
        ...theme.spacing,
        controlHeight: 30,
        baseUnit: 2
      }
    })}
    value={value && options.find((o: any) => o.value == value)}
    onChange={onChange}
    options={options}
  />
);

function LogSettings() {
  const { isLoading, data } = useQuery({
    queryKey: ["config"],
    queryFn: APIClient.config.get,
    retry: false,
    refetchOnWindowFocus: false,
    onError: err => console.log(err)
  });

  const queryClient = useQueryClient();

  const setLogLevelUpdateMutation = useMutation({
    mutationFn: (value: string) => APIClient.config.update({ log_level: value }),
    onSuccess: () => {
      toast.custom((t) => <Toast type="success" body={"Config successfully updated!"} t={t} />);

      queryClient.invalidateQueries({ queryKey: ["config"] });
    }
  });

  return (
    <Section
      title="Logs"
      description={
        <>
          Configure log level, log size rotation, etc. You can download your old log files
          {" "}
          <Link
            to="/logs"
            className="text-gray-700 dark:text-gray-200 underline font-semibold underline-offset-2 decoration-blue-500 decoration hover:text-black hover:dark:text-gray-100"
          >
            on the Logs page
          </Link>.
        </>
      }
    >
      <form className="-mx-4 lg:col-span-9" action="#" method="POST">
        {!isLoading && data && (
          <dl className="divide-y divide-gray-200 dark:divide-gray-750">
            <RowItem label="Path" value={data?.log_path} title="Set in config.toml" emptyText="Not set!" />
            <RowItem
              label="Level"
              title="Log level"
              value={
                <SelectWrapper
                  id="log_level"
                  value={data?.log_level}
                  options={LogLevelOptions}
                  onChange={(value: SelectOption) => setLogLevelUpdateMutation.mutate(value.value)}
                />
              }
            />
            <RowItem label="Max Size" value={data?.log_max_size} title="Set in config.toml" rightSide="MB" />
            <RowItem label="Max Backups" value={data?.log_max_backups} title="Set in config.toml" />
          </dl>
        )}
      </form>
      
    </Section>
  );
}

export default LogSettings;
