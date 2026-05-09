import { createFileRoute } from "@tanstack/react-router"
import { EarnPage } from "../features/earn/components/earn-page"

export const Route = createFileRoute("/earn")({ component: EarnPage })
