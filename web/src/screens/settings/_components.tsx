/*
 * Copyright (c) 2021 - 2023, Ludvig Lundgren and the autobrr contributors.
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import { classNames } from "@utils";

type SectionProps = {
  title: string;
  description: string | React.ReactNode;
  rightSide?: React.ReactNode;
  children?: React.ReactNode;
};

export const Section = ({
  title,
  description,
  rightSide,
  children
}: SectionProps) => (
  <div className="py-6 px-4 lg:col-span-9">
    <div
      className={classNames(
        "pb-4",
        rightSide
          ? "flex justify-between items-center flex-wrap sm:flex-nowrap"
          : ""
      )}
    >
      <div>
        <h2 className="text-lg leading-4 font-bold text-gray-900 dark:text-white">{title}</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
      </div>
      {rightSide ? (
        <div className="ml-4 mt-4 flex-shrink-0">
          {rightSide}
        </div>
      ) : null}
    </div>
    {children}
  </div>
);

interface RowItemProps {
  label: string;
  value?: string | React.ReactNode;
  title?: string;
  emptyText?: string;
  rightSide?: React.ReactNode;
}

export const RowItem = ({ label, value, title, emptyText, rightSide }: RowItemProps) => (
  <div className="py-4 sm:px-4 sm:grid sm:grid-cols-4 sm:gap-4">
    <div className="font-medium text-gray-900 dark:text-white text-sm self-center" title={title}>{label}</div>
    <div className="mt-1 text-gray-900 dark:text-gray-300 text-sm sm:mt-0 sm:col-span-3 break-all">
      {value
        ? (
          <>
            {typeof (value) === "string" ? (
              <span className="px-1.5 py-1 bg-gray-200 dark:bg-gray-700 rounded shadow text-ellipsis leading-7">
                {value}
              </span>
            ) : value}
            {rightSide ?? null}
          </>
        )
        : (emptyText ?? null)
      }
    </div>
  </div>
);
