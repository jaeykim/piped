"use client";

import { CheckCircle, Globe, PenTool, Image, Megaphone, Users } from "lucide-react";
import type { PipelineStage, CampaignType } from "@/types/project";

const allStages: { id: PipelineStage; label: string; icon: typeof Globe }[] = [
  { id: "analysis", label: "Analysis", icon: Globe },
  { id: "copy", label: "Copy", icon: PenTool },
  { id: "creatives", label: "Creatives", icon: Image },
  { id: "campaigns", label: "Campaigns", icon: Megaphone },
  { id: "affiliates", label: "Affiliates", icon: Users },
];

interface PipelineStepperProps {
  currentStage: PipelineStage;
  campaignType?: CampaignType;
  onStageClick?: (stage: PipelineStage) => void;
}

export function PipelineStepper({
  currentStage,
  campaignType,
  onStageClick,
}: PipelineStepperProps) {
  // Filter stages based on campaign type
  const stages = campaignType === "influencer"
    ? allStages.filter((s) => s.id !== "campaigns")
    : campaignType
    ? allStages.filter((s) => s.id !== "affiliates")
    : allStages;

  const currentIndex = stages.findIndex((s) => s.id === currentStage);

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2">
      {stages.map((stage, i) => {
        const Icon = stage.icon;
        const isComplete = i < currentIndex;
        const isCurrent = i === currentIndex;
        const isLocked = i > currentIndex;

        return (
          <div key={stage.id} className="flex items-center">
            <button
              onClick={() => !isLocked && onStageClick?.(stage.id)}
              disabled={isLocked}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isCurrent
                  ? "bg-indigo-100 text-indigo-700"
                  : isComplete
                  ? "bg-green-50 text-green-700 hover:bg-green-100"
                  : "bg-gray-50 text-gray-400 cursor-not-allowed"
              }`}
            >
              {isComplete ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <Icon className="h-4 w-4" />
              )}
              <span className="whitespace-nowrap">{stage.label}</span>
            </button>
            {i < stages.length - 1 && (
              <div
                className={`mx-1 h-px w-6 ${
                  i < currentIndex ? "bg-green-300" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
