import type { ReactNode } from "react"

type PoolsCardProps = {
  title: string
  description?: string
  contentHeader?: ReactNode
  children: ReactNode
  bottomContent?: ReactNode
}

export function PoolsCard({
  title,
  description,
  contentHeader,
  children,
  bottomContent,
}: PoolsCardProps) {
  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {description ? (
            <p className="mt-1 text-[13px] text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {contentHeader}
      </div>

      <div className="min-w-0 overflow-x-auto">{children}</div>

      {bottomContent ? (
        <div className="border-t border-border px-4 py-3 sm:px-5">{bottomContent}</div>
      ) : null}
    </section>
  )
}
