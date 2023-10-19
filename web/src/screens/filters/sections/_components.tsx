import { ChevronDownIcon } from "@heroicons/react/24/solid";

import { classNames } from "@utils";
import { useToggle } from "@hooks/hooks";
import { TitleSubtitle } from "@components/headings";

type FilterSectionProps = {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
};

export const FilterSection = ({
  title,
  subtitle,
  children
}: FilterSectionProps) => {
  return (
    <div
      className={classNames(
        "",
        "flex flex-col gap-x-2 gap-y-6 sm:gap-y-3"
      )}
    >
      {(title && subtitle) ? (
        <TitleSubtitle
          title={title}
          subtitle={subtitle}
          className="pt-4"
        />
      ) : null}
      {children}
    </div>
  )
};

type FilterPageProps = {
  children: React.ReactNode;
};

export const FilterPage = ({
  children
}: FilterPageProps) => {
  return (
    <div className="flex flex-col gap-y-6 sm:gap-y-3 divide-y divide-gray-150 dark:divide-gray-750">
      {children}
    </div>
  )
}

interface CollapsibleSectionProps {
  title: string;
  subtitle?: string | React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

// NOTE(stacksmash76): added text-shadow only for the dark theme - light theme is fine contrast-wise when it comes to headings
// ideally, this would need a redesign
export function CollapsibleSection({ title, subtitle, children, defaultOpen = false }: CollapsibleSectionProps) {
  const [isOpen, toggleOpen] = useToggle(defaultOpen ?? false);

  return (
    <div
      className={classNames(
        isOpen ? "pb-6" : "pb-3",
        "rounded-t-lg border-dashed border-b-2 border-gray-150 dark:border-gray-775"
      )}
    >
      <div
        className="flex select-none items-center py-3.5 px-1 cursor-pointer transition rounded-lg hover:bg-gray-100 dark:hover:bg-gray-725"
        onClick={toggleOpen}
      >
        <div className="flex flex-row gap-2 items-center">
          <button
            type="button"
            className={classNames(
              isOpen ? "rotate-0" : "-rotate-90",
              "text-sm font-medium text-white transition-transform"
            )}
          >
            <ChevronDownIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
          </button>
          <div
            className={classNames(
              isOpen ? "flex-col gap-0" : "flex-col sm:flex-row sm:items-end sm:gap-2",
              "flex"
            )}
          >
            <h3 className="text-xl leading-6 font-bold break-all dark:text-shadow dark:shadow-gray-900 text-gray-900 dark:text-gray-200">
              {title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate whitespace-normal break-words">
              {subtitle}
            </p>
          </div>
        </div>
      </div>
      {/*TODO: Animate this too*/}
      {isOpen && (
        <div className="sm:px-2 mt-2 grid grid-cols-12 gap-x-2 sm:gap-x-4 gap-y-6 sm:gap-y-3">
          {children}
        </div>
      )}
    </div>
  );
}
