import { useCallback, useEffect, useState } from 'react';
import { BottomNav, type Tab } from './components/BottomNav';
import { IntroQuote } from './components/IntroQuote';
import { SholatGate } from './components/SholatGate';
      <main>
        {tab === 'today' && <Home />}
        {tab === 'stats' && <Stats />}
        {tab === 'tools' && <Tools />}
        {tab === 'settings' && <Settings />}
      {showIntro && <IntroQuote quote={INTRO_QUOTE} onClose={closeIntro} />}
    </div>
  );
}









