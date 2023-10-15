/*
 * Copyright (c) 2021 - 2023, Ludvig Lundgren and the autobrr contributors.
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import type { FieldProps } from "formik";
import { Field } from "formik";
import { Switch as HeadlessSwitch } from "@headlessui/react";

import { classNames } from "@utils";
import { DocsTooltip } from "@components/tooltips/DocsTooltip";
import { Checkbox } from "@components/Checkbox";

interface SwitchGroupProps {
  name: string;
  label?: string;
  description?: string | React.ReactNode;
  heading?: boolean;
  tooltip?: JSX.Element;
  disabled?: boolean;
}

const SwitchGroup = ({
  name,
  label,
  description,
  tooltip,
  heading,
  disabled
}: SwitchGroupProps) => (
  <HeadlessSwitch.Group as="ol" className="flex items-center justify-between">
    {label && <div className="flex flex-col">
      <HeadlessSwitch.Label
        passive
        as={heading ? "h2" : "span"}
        className={classNames(
          "flex float-left cursor-default text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wide",
          heading ? "text-lg" : "text-sm"
        )}
      >
        <div className="flex">
          {tooltip ? (
            <DocsTooltip label={label}>{tooltip}</DocsTooltip>
          ) : label}
        </div>
      </HeadlessSwitch.Label>
      {description && (
        <HeadlessSwitch.Description className="text-sm mt-1 text-gray-500 dark:text-gray-400">
          {description}
        </HeadlessSwitch.Description>
      )}
    </div>
    }

    <Field name={name} type="checkbox">
      {({
        field,
        form: { setFieldValue }
      }: FieldProps) => (
        <Checkbox
          {...field}
          value={!!field.checked}
          setValue={(value) => {
            setFieldValue(field?.name ?? "", value);
          }}
          disabled={disabled}
        />
      )}
    </Field>
  </HeadlessSwitch.Group>
);

export { SwitchGroup };
