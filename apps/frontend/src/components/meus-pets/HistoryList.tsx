import { Icon } from "@/components/ui/Icon";
import { historyItems } from "@/content/meus-pets";

export function HistoryList() {
  return (
    <div className="overflow-hidden rounded-2xl border border-surface-variant bg-surface-container-lowest soft-shadow">
      {historyItems.map((item, index) => (
        <div
          key={item.id}
          className={`flex items-center justify-between p-4 transition-colors hover:bg-surface-container-low ${
            index < historyItems.length - 1
              ? "border-b border-surface-variant"
              : ""
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-surface-container-highest p-2 text-on-surface-variant">
              <Icon name={item.icon} />
            </div>
            <div>
              <h4 className="font-body-md font-semibold text-on-surface">
                {item.title}
              </h4>
              <p className="font-label-md text-on-surface-variant">
                {item.subtitle}
              </p>
            </div>
          </div>
          <span className="hidden rounded-full bg-tertiary-fixed px-3 py-1 font-label-md text-tertiary sm:inline-block">
            {item.status}
          </span>
        </div>
      ))}
    </div>
  );
}
