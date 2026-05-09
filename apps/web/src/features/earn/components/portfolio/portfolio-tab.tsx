import { RewardsBar } from "./rewards-bar"
import { RecommendedAssets } from "./recommended-assets"
import { AssetsList } from "./assets-list"

export function PortfolioTab() {
  return (
    <div className="space-y-8">
      <RewardsBar />
      <RecommendedAssets />
      <AssetsList />
    </div>
  )
}
