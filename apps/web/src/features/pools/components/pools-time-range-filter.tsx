import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import type { PoolsTimeRange } from "../hooks/use-pools-time-range"

type PoolsTimeRangeFilterProps = {
  value: PoolsTimeRange
  options: Array<{ value: PoolsTimeRange; label: string }>
  onChange: (value: PoolsTimeRange) => void
}

export function PoolsTimeRangeFilter({
  value,
  options,
  onChange,
}: PoolsTimeRangeFilterProps) {
  return (
    <Tabs value={value} onValueChange={(next) => onChange(next as PoolsTimeRange)}>
      <TabsList className="h-9">
        {options.map((option) => (
          <TabsTrigger key={option.value} value={option.value}>
            {option.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
