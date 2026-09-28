/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Header } from './components/Header';
import { AtomBuilder } from './components/AtomBuilder';
import { StatesOfMatter } from './components/StatesOfMatter';
import { RadioactiveDecay } from './components/RadioactiveDecay';
import { GuideModal } from './components/GuideModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<'atom-builder' | 'states-of-matter' | 'radioactive-decay'>('atom-builder');
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenGuide={() => setIsGuideOpen(true)}
      />

      {/* Main Simulator Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {activeTab === 'atom-builder' && <AtomBuilder />}
        {activeTab === 'states-of-matter' && <StatesOfMatter />}
        {activeTab === 'radioactive-decay' && <RadioactiveDecay />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 px-4 py-4 text-center text-xs text-slate-500 font-medium">
        <p>
          محاكي سلوك الذرات وحالات المادة والنشاط الإشعاعي التفاعلي — تم التحديث ليشمل جميع العناصر الـ 118، والانتقال الطوري التلقائي، وأمثلة النظائر الإشعاعية الموسعة.
        </p>
      </footer>

      {/* Conceptual Guide Modal */}
      <GuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
}
