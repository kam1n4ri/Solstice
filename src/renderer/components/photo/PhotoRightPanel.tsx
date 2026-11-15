import React, { memo } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { PhotoToolType } from '@shared/types';
import { PhotoCropInspector } from './tools/PhotoCropInspector';
import { PhotoFitInspector } from './tools/PhotoFitInspector';
import { PhotoAdjustInspector } from './tools/PhotoAdjustInspector';
import { PhotoFiltersInspector } from './tools/PhotoFiltersInspector';
import { PhotoCutoutInspector } from './tools/PhotoCutoutInspector';
import { PhotoEraseInspector } from './tools/PhotoEraseInspector';
import { PhotoDrawInspector } from './tools/PhotoDrawInspector';
import { PhotoTextInspector } from './tools/PhotoTextInspector';
import { PhotoUpscaleInspector } from './tools/PhotoUpscaleInspector';
import { UpscaleOptions } from './tools/photoUpscaleHelper';
import { PhotoLayerStack } from './layers/PhotoLayerStack';
import { usePhotoTransform } from './hooks/usePhotoTransform';
import { usePhotoAdjustments } from './hooks/usePhotoAdjustments';
import { usePhotoCutout } from './hooks/usePhotoCutout';
import { usePhotoDraw } from './hooks/usePhotoDraw';
import { usePhotoText } from './hooks/usePhotoText';

interface PhotoRightPanelProps {
  activeTool: PhotoToolType | null;
  onSelectTool?: (tool: PhotoToolType | null) => void;
  imageSrc: string;
  fileName: string;
  dimensions: { width: number; height: number };
  transform: ReturnType<typeof usePhotoTransform>;
  tone: ReturnType<typeof usePhotoAdjustments>;
  cutout: ReturnType<typeof usePhotoCutout>;
  draw: ReturnType<typeof usePhotoDraw>;
  text: ReturnType<typeof usePhotoText>;
  onApplyUpscale?: (options: UpscaleOptions) => void;
  onCancelUpscale?: () => void;
  isUpscaling?: boolean;
  upscaleProgress?: number;
}

export const PhotoRightPanel: React.FC<PhotoRightPanelProps> = memo(({
  activeTool,
  onSelectTool,
  imageSrc,
  fileName,
  dimensions,
  transform,
  tone,
  cutout,
  draw,
  text,
  onApplyUpscale,
  onCancelUpscale,
  isUpscaling = false,
  upscaleProgress = 0,
}) => {
  return (
    <aside className="w-72 border-l border-stone-200/80 bg-[#fafbfc]/90 flex flex-col h-full shrink-0 select-none overflow-hidden z-10">
      <div className="flex-1 flex flex-col border-b border-stone-200/80 overflow-y-auto custom-scrollbar">
        <div className="px-4 py-3 border-b border-stone-200/60 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-stone-500" />
            <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
              {activeTool ? activeTool.toUpperCase() : 'Inspector'}
            </h3>
          </div>
        </div>

        {activeTool === 'cutout' ? (
          <PhotoCutoutInspector
            subMode={cutout.subMode}
            onSelectSubMode={cutout.setSubMode}
            strokeAction={cutout.strokeAction}
            onSelectStrokeAction={cutout.setStrokeAction}
            brushSize={cutout.brushSize}
            onChangeBrushSize={cutout.setBrushSize}
            tolerance={cutout.tolerance}
            onChangeTolerance={cutout.setTolerance}
            previewMode={cutout.previewMode}
            onSelectPreviewMode={cutout.setPreviewMode}
            onAutoRemove={cutout.handleAutoRemove}
            onClassicalAutoRemove={cutout.handleClassicalAutoRemove}
            onInvertMask={cutout.handleInvertMask}
            onResetMask={cutout.handleResetMask}
            onApply={cutout.handleApplyCutout}
            onCancel={cutout.handleCancelCutout}
            onSwitchToHealing={() => onSelectTool?.('erase')}
            isProcessing={cutout.isProcessing}
            statusMessage={cutout.statusMessage}
            progressPercent={cutout.progressPercent}
          />
        ) : activeTool === 'erase' ? (
          <PhotoEraseInspector
            eraseMode={cutout.eraseMode}
            onSelectEraseMode={cutout.setEraseMode}
            brushSize={cutout.brushSize}
            onChangeBrushSize={cutout.setBrushSize}
            inpaintRadius={cutout.inpaintRadius}
            onChangeInpaintRadius={cutout.setInpaintRadius}
            onReset={cutout.handleResetMask}
            onApply={
              cutout.eraseMode === 'inpaint'
                ? cutout.handleInpaintObject
                : cutout.handleApplyCutout
            }
            onCancel={cutout.handleCancelCutout}
            isProcessing={cutout.isProcessing}
          />
        ) : activeTool === 'draw' ? (
          <PhotoDrawInspector
            brush={draw.brush}
            onChangeBrush={draw.handleChangeBrush}
            onClearDrawing={draw.handleClearDrawing}
            onApply={draw.handleApplyDrawing}
            onCancel={draw.handleCancelDrawing}
          />
        ) : activeTool === 'text' ? (
          <PhotoTextInspector
            options={text.options}
            onChangeOption={text.handleChangeOption}
            onApply={text.handleApplyText}
            onCancel={text.handleCancelText}
          />
        ) : activeTool === 'adjust' ? (
          <PhotoAdjustInspector
            adjustments={tone.adjustments}
            onChangeAdjustment={tone.handleChangeAdjustment}
            onResetAll={tone.handleResetAllAdjustments}
            onApply={tone.handleApplyAdjustments}
            onCancel={tone.handleCancelAdjustments}
            isProcessing={tone.isApplying}
          />
        ) : activeTool === 'filters' ? (
          <PhotoFiltersInspector
            imageSrc={imageSrc}
            selectedFilterId={tone.selectedFilterId}
            filterIntensity={tone.filterIntensity}
            onSelectFilter={tone.handleSelectFilter}
            onChangeIntensity={tone.setFilterIntensity}
            onApply={tone.handleApplyFilter}
            onCancel={tone.handleCancelFilter}
          />
        ) : activeTool === 'crop' ? (
          <PhotoCropInspector
            selectedPreset={transform.cropPreset}
            onSelectPreset={transform.handleSelectCropPreset}
            rotation={transform.rotation}
            onRotateCw={transform.handleRotateCw}
            onRotateCcw={transform.handleRotateCcw}
            flipH={transform.flipH}
            onToggleFlipH={transform.handleToggleFlipH}
            flipV={transform.flipV}
            onToggleFlipV={transform.handleToggleFlipV}
            straightenAngle={transform.straightenAngle}
            onStraightenChange={transform.handleStraightenChange}
            onApply={transform.handleApplyCrop}
            onCancel={transform.handleCancelCrop}
          />
        ) : activeTool === 'upscale' ? (
          <PhotoUpscaleInspector
            dimensions={dimensions}
            onApplyUpscale={onApplyUpscale || (() => {})}
            onCancel={onCancelUpscale || (() => {})}
            isProcessing={isUpscaling}
            progress={upscaleProgress}
          />
        ) : activeTool === 'fit' ? (
          <PhotoFitInspector
            selectedPreset={transform.fitPreset}
            onSelectPreset={transform.handleSelectFitPreset}
            fillType={transform.fitFillType}
            onFillTypeChange={transform.setFitFillType}
            fillColor={transform.fitFillColor}
            onFillColorChange={transform.setFitFillColor}
            scale={transform.fitScale}
            onScaleChange={transform.setFitScale}
            borderRadius={transform.fitBorderRadius}
            onBorderRadiusChange={transform.setFitBorderRadius}
            borderWidth={transform.fitBorderWidth}
            onBorderWidthChange={transform.setFitBorderWidth}
            onApply={transform.handleApplyFit}
            onCancel={transform.handleCancelFit}
          />
        ) : (
          <div className="p-4 flex-1 flex flex-col justify-center items-center text-center text-slate-400">
            <div className="space-y-2">
              <SlidersHorizontal className="h-6 w-6 mx-auto text-slate-300" />
              <p className="text-xs text-slate-400">
                Select a tool from the left toolbar to configure adjustments.
              </p>
            </div>
          </div>
        )}
      </div>

      <PhotoLayerStack
        imageSrc={imageSrc}
        fileName={fileName}
        dimensions={dimensions}
      />
    </aside>
  );
});
