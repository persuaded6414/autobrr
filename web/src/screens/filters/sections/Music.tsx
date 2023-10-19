import type { FormikValues } from "formik";

import { DocsLink } from "@components/ExternalLink";
import { TitleSubtitle } from "@components/headings";
import * as Input from "@components/inputs";

import * as CONSTS from "@domain/constants";

export const Music = ({ values }: { values: FormikValues; }) => (
  <div className="divide-y divide-gray-150 dark:divide-gray-750">
    <div className="pt-4 pb-6 grid grid-cols-12 gap-x-2 gap-y-6 sm:gap-y-3">
      <Input.TextAreaAutoResize
        name="artists"
        label="Artists"
        columns={4}
        placeholder="eg. Artist One"
        tooltip={
          <div>
            <p>You can use basic filtering like wildcards <code>*</code> or replace single characters with <code>?</code></p>
            <DocsLink href="https://autobrr.com/filters#music" />
          </div>
        }
      />
      <Input.TextAreaAutoResize
        name="albums"
        label="Albums"
        columns={4}
        placeholder="eg. That Album"
        tooltip={
          <div>
            <p>You can use basic filtering like wildcards <code>*</code> or replace single characters with <code>?</code></p>
            <DocsLink href="https://autobrr.com/filters#music" />
          </div>
        }
      />
      <Input.TextField
        name="years"
        label="Years"
        columns={4}
        placeholder="eg. 2018,2019-2021"
        tooltip={
          <div>
            <p>This field takes a range of years and/or comma separated single years.</p>
            <DocsLink href="https://autobrr.com/filters#music" />
          </div>
        }
      />
    </div>

    <div className="py-6 flex flex-col gap-y-6 sm:gap-y-3">
      <TitleSubtitle title="Quality" subtitle="Format, source, log etc." />

      <div className="grid grid-cols-12 gap-x-2 sm:gap-x-4 gap-y-6 sm:gap-y-3">
        <Input.MultiSelect
          name="formats"
          options={CONSTS.FORMATS_OPTIONS}
          label="Format"
          columns={6}
          disabled={values.perfect_flac}
          tooltip={
            <div>
              <p>Will only match releases with any of the selected formats. This is overridden by Perfect FLAC.</p>
              <DocsLink href="https://autobrr.com/filters#quality-1" />
            </div>
          }
        />
        <Input.MultiSelect
          name="quality"
          options={CONSTS.QUALITY_MUSIC_OPTIONS}
          label="Quality"
          columns={6}
          disabled={values.perfect_flac}
          tooltip={
            <div>
              <p>Will only match releases with any of the selected qualities. This is overridden by Perfect FLAC.</p>
              <DocsLink href="https://autobrr.com/filters#quality-1" />
            </div>
          }
        />
      </div>

      <div className="grid grid-cols-12 gap-x-2 sm:gap-x-4 gap-y-6 sm:gap-y-3">
        <Input.MultiSelect
          name="media"
          options={CONSTS.SOURCES_MUSIC_OPTIONS}
          label="Media"
          columns={6}
          disabled={values.perfect_flac}
          tooltip={
            <div>
              <p>Will only match releases with any of the selected sources. This is overridden by Perfect FLAC.</p>
              <DocsLink href="https://autobrr.com/filters#quality-1" />
            </div>
          }
        />
        <Input.MultiSelect
          name="match_release_types"
          options={CONSTS.RELEASE_TYPE_MUSIC_OPTIONS}
          label="Type"
          columns={6}
          tooltip={
            <div>
              <p>Will only match releases with any of the selected types.</p>
              <DocsLink href="https://autobrr.com/filters#quality-1" />
            </div>
          }
        />
      </div>

      <div className="grid grid-cols-12 gap-x-2 sm:gap-x-4 gap-y-6 sm:gap-y-3">
        <div className="col-span-12 sm:col-span-6">
          <Input.SwitchGroup
            name="perfect_flac"
            label="Perfect FLAC"
            description="Override all options about quality, source, format, and cue/log/log score."
            tooltip={
              <div>
                <p>Override all options about quality, source, format, and CUE/LOG/LOG score.</p>
                <DocsLink href="https://autobrr.com/filters#quality-1" />
              </div>
            }
          />
        </div>

        <span className="col-span-12 sm:col-span-6 self-center ml-0 text-center sm:text-left text-sm text-gray-500 dark:text-gray-425 underline underline-offset-2">
          This is what you want in 99% of cases (instead of options below).
        </span>

        <div className="col-span-12 flex items-center justify-center">
          <span className="border-b border-gray-150 dark:border-gray-750 w-full" />
          <span className="flex mx-2 shrink-0 text-lg font-bold uppercase tracking-wide text-gray-700 dark:text-gray-200">
            OR
          </span>
          <span className="border-b border-gray-150 dark:border-gray-750 w-full" />
        </div>

        <div className="col-span-12 sm:col-span-6 flex flex-col gap-y-6 sm:gap-y-3">
          <Input.SwitchGroup
            name="log"
            label="Log"
            description="Must include LOG info"
            disabled={values.perfect_flac}
            className=""
          />
          <Input.NumberField
            name="log_score"
            label="Log score"
            placeholder="eg. 100"
            min={0}
            max={100}
            disabled={values.perfect_flac || !values.log}
            tooltip={
              <div>
                <p>Log scores go from 0 to 100. This is overridden by Perfect FLAC.</p>
                <DocsLink href="https://autobrr.com/filters#quality-1" />
              </div>
            }
          />
        </div>

        <div className="col-span-12 sm:col-span-6">
          <Input.SwitchGroup
            name="cue"
            label="Cue"
            description="Must include CUE info"
            disabled={values.perfect_flac}
            className=""
          />
        </div>
      </div>
    </div>
  </div>
);
