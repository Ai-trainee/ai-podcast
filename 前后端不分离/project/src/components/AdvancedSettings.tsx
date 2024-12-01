'use client';

interface AdvancedSettingsProps {
  onSettingsChange: (settings: any) => void;
}

export default function AdvancedSettings({ onSettingsChange }: AdvancedSettingsProps) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          语音风格
        </label>
        <select 
          className="w-full rounded-lg border border-gray-200 p-2.5 input-focus"
          onChange={(e) => onSettingsChange({ voiceStyle: e.target.value })}
        >
          <option value="natural">自然</option>
          <option value="broadcast">播音</option>
          <option value="casual">随意</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          语速调节
        </label>
        <input 
          type="range" 
          min="0.5" 
          max="2" 
          step="0.1" 
          defaultValue="1"
          onChange={(e) => onSettingsChange({ speed: e.target.value })}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          背景音乐
        </label>
        <select 
          className="w-full rounded-lg border border-gray-200 p-2.5 input-focus"
          onChange={(e) => onSettingsChange({ bgm: e.target.value })}
        >
          <option value="none">无</option>
          <option value="light">轻音乐</option>
          <option value="dynamic">动感</option>
        </select>
      </div>
    </div>
  );
} 