/*
 * Copyright (c) 2021 - 2023, Ludvig Lundgren and the autobrr contributors.
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import { Field, FieldProps } from "formik";
import { classNames } from "@utils";
import { DocsTooltip } from "@components/tooltips/DocsTooltip";

interface ErrorFieldProps {
    name: string;
    classNames?: string;
}

const ErrorField = ({ name, classNames }: ErrorFieldProps) => (
  <div>
    <Field name={name} subscribe={{ touched: true, error: true }}>
      {({ meta: { touched, error } }: FieldProps) =>
        touched && error ? <span className={classNames}>{error}</span> : null
      }
    </Field>
  </div>
);

interface RequiredFieldProps {
  required?: boolean
}

const RequiredField = ({ required }: RequiredFieldProps) => (
  <>
    {required && <span className="ml-1 text-red-500">*</span>}
  </>
);

export { ErrorField, RequiredField };
