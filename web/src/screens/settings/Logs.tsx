/*
 * Copyright (c) 2021 - 2023, Ludvig Lundgren and the autobrr contributors.
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { Link } from "react-router-dom";
import Select from "react-select";

import { APIClient } from "@api/APIClient";
import Toast from "@components/notifications/Toast";
import { LogLevelOptions, SelectOption } from "@domain/constants";

import { Section, RowItem } from "./_components";
import * as common from "@components/inputs/common";

type SelectWrapperProps = {
  id: string;
  value: unknown;
  onChange: any;
  options: unknown[];
};

const SelectWrapper = ({ id, value, onChange, options }: SelectWrapperProps) => (
  <Select
    id={id}
    components={{
      Input: common.SelectInput,
      Control: common.SelectControl,
      Menu: common.SelectMenu,
      Option: common.SelectOption
    }}
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
          <div className="divide-y divide-gray-200 dark:divide-gray-750">
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
          </div>
        )}
      </form>
      
    </Section>
  );
}

export default LogSettings;
