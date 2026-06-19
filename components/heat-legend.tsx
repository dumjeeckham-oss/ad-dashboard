export function HeatLegend() {
  return (
    <div className="rounded-xl border-2 border-border bg-card/95 p-3 shadow-md backdrop-blur">
      <p className="mb-2 text-base font-bold md:text-lg">유동인구</p>
      <div className="h-3 w-full rounded-full bg-gradient-to-r from-heat-low via-heat-mid to-heat-high" />
      <div className="mt-1.5 flex justify-between text-sm font-semibold text-muted-foreground md:text-base">
        <span>여유</span>
        <span>보통</span>
        <span>혼잡</span>
      </div>
    </div>
  )
}
