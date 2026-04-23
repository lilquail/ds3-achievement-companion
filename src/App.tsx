import React, { useState, useEffect, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import data from './data.json';
import './index.css';

type Category = keyof typeof data;
type ActiveCategory = Category | 'Home' | 'All';

const categories: Category[] = [
  'Rings',
  'Rings +1',
  'Rings +2',
  'Rings +3',
  'Gestures',
  'Miracles',
  'Sorceries',
  'Pyromancies',
  'Infusions',
];

const categorySet = new Set<string>(categories);
const ringCategories: Category[] = ['Rings', 'Rings +1', 'Rings +2', 'Rings +3'];

const isCategory = (value: string): value is Category => categorySet.has(value);

const isActiveCategory = (value: string | null): value is ActiveCategory => {
  return value === 'Home' || value === 'All' || (value !== null && isCategory(value));
};

const getStoredActiveCategory = (): ActiveCategory => {
  const saved = localStorage.getItem('ds3-active-category');
  return isActiveCategory(saved) ? saved : 'Home';
};

const getStoredCollected = (): Set<string> => {
  const saved = localStorage.getItem('ds3-collected');
  if (!saved) return new Set();

  try {
    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed)) return new Set();

    return new Set(parsed.filter((id): id is string => typeof id === 'string'));
  } catch {
    return new Set();
  }
};

const sanitizeDescriptionHtml = (html: string): string => {
  if (typeof document === 'undefined') return html;

  const template = document.createElement('template');
  template.innerHTML = html;
  const allowedTags = new Set(['A', 'BR', 'LI', 'OL', 'P', 'STRONG', 'EM', 'UL']);

  template.content.querySelectorAll('*').forEach(element => {
    if (!allowedTags.has(element.tagName)) {
      element.replaceWith(...Array.from(element.childNodes));
      return;
    }

    for (const attribute of Array.from(element.attributes)) {
      const attrName = attribute.name.toLowerCase();
      const attrValue = attribute.value.trim();
      const isAllowedLinkAttr =
        element.tagName === 'A' &&
        ['class', 'href', 'rel', 'target'].includes(attrName);

      if (!isAllowedLinkAttr || attrName.startsWith('on')) {
        element.removeAttribute(attribute.name);
        continue;
      }

      if (attrName === 'href' && !/^https?:\/\//i.test(attrValue)) {
        element.removeAttribute(attribute.name);
      }
    }

    if (element.tagName === 'A') {
      element.setAttribute('class', 'description-link');
      element.setAttribute('target', '_blank');
      element.setAttribute('rel', 'noreferrer');
    }
  });

  return template.innerHTML;
};

const categoryDisplayNames: Record<string, string> = {
  Rings: 'Master of Rings',
  'Rings +1': 'Master of Rings (+1)',
  'Rings +2': 'Master of Rings (+2)',
  'Rings +3': 'Master of Rings (+3)',
  Gestures: 'Master of Expression',
  Miracles: 'Master of Miracles',
  Sorceries: 'Master of Sorceries',
  Pyromancies: 'Master of Pyromancies',
  Infusions: 'Master of Infusion',
};

interface Item {
  id: string;
  name: string;
  wikiLink: string;
  description?: string;
  icon?: string;
  requirement?: {
    name: string;
    icon: string;
    url: string;
  };
}

export default function App() {
  const [activeCategory, setActiveCategory] = useState<ActiveCategory>(getStoredActiveCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [hideCollected, setHideCollected] = useState<boolean>(() =>
    localStorage.getItem('ds3-hide-collected') === 'true'
  );
  const [groupRingVariants, setGroupRingVariants] = useState<boolean>(() => {
    const saved = localStorage.getItem('ds3-group-rings');
    return saved === null ? true : saved === 'true';
  });
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  
  const [collected, setCollected] = useState<Set<string>>(getStoredCollected);

  useEffect(() => {
    localStorage.setItem('ds3-active-category', activeCategory);
  }, [activeCategory]);

  useEffect(() => {
    localStorage.setItem('ds3-collected', JSON.stringify(Array.from(collected)));
  }, [collected]);

  useEffect(() => {
    localStorage.setItem('ds3-hide-collected', String(hideCollected));
  }, [hideCollected]);

  useEffect(() => {
    localStorage.setItem('ds3-group-rings', String(groupRingVariants));
  }, [groupRingVariants]);

  // Track previous size so confetti only fires when an item is ADDED
  const prevSizeRef = useRef(collected.size);

  useEffect(() => {
    const prevSize = prevSizeRef.current;
    prevSizeRef.current = collected.size;

    // Only fire when the collection grew
    if (collected.size <= prevSize) return;
    // Only fire for a real category (not Home / All)
    if (activeCategory === 'Home' || activeCategory === 'All') return;

    let catItems: Item[] = [];
    if (activeCategory === 'Rings') {
      catItems = ringCategories.flatMap(cat => data[cat] as Item[]);
    } else {
      catItems = data[activeCategory] as Item[];
    }
    
    if (!catItems || catItems.length === 0) return;

    const allDone = catItems.every(item => collected.has(item.id));
    if (!allDone) return;

    // DS3-themed confetti burst
    const ds3Colors = ['#c8a84b', '#897859', '#e8d5a3', '#ffffff', '#8b0000'];
    const fire = (particleRatio: number, opts: confetti.Options) =>
      confetti({
        origin: { y: 0.6 },
        colors: ds3Colors,
        ...opts,
        particleCount: Math.floor(200 * particleRatio),
      });

    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2,  { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1,  { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1,  { spread: 120, startVelocity: 45 });
  }, [collected, activeCategory]);

  const toggleItem = (id: string) => {
    setCollected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearCollected = () => {
    setShowClearConfirm(true);
  };

  const confirmClear = () => {
    setCollected(new Set());
    setShowClearConfirm(false);
  };

  const cancelClear = () => {
    setShowClearConfirm(false);
  };

  const toggleHideCollected = () => {
    setHideCollected(!hideCollected);
  };

  const toggleGroupRingVariants = () => {
    setGroupRingVariants(!groupRingVariants);
  };

  const handleCategoryChange = (cat: ActiveCategory) => {
    setActiveCategory(cat);
    setSearchQuery('');
  };

  const displayedData = useMemo(() => {
    if (activeCategory === 'Home') return [];
    
    if (activeCategory === 'Rings' && !groupRingVariants) {
      const baseRings = data['Rings'] as Item[];
      const allRings = ringCategories.flatMap(cat => data[cat] as Item[]).filter((item: Item) => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        const isCollected = collected.has(item.id);
        const matchesHide = hideCollected ? !isCollected : true;
        return matchesSearch && matchesHide;
      }).sort((a, b) => {
        const getBaseId = (id: string) => id.replace(/[123]$/, '');
        const baseA = getBaseId(a.id);
        const baseB = getBaseId(b.id);
        const indexA = baseRings.findIndex(r => r.id === baseA);
        const indexB = baseRings.findIndex(r => r.id === baseB);
        if (indexA === -1 || indexB === -1) return a.name.localeCompare(b.name);
        if (indexA !== indexB) return indexA - indexB;
        return a.id.localeCompare(b.id);
      });
      
      return [{ category: 'Rings', items: allRings }];
    }

    let catsToRender: Category[] = [];
    if (activeCategory === 'All') {
      catsToRender = categories;
    } else if (activeCategory === 'Rings') {
      catsToRender = ringCategories;
    } else {
      catsToRender = [activeCategory];
    }
    
    return catsToRender.map(cat => {
      const items = data[cat].filter((item: Item) => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        const isCollected = collected.has(item.id);
        const matchesHide = hideCollected ? !isCollected : true;
        return matchesSearch && matchesHide;
      });
      return { category: cat, items };
    }).filter(group => group.items.length > 0);
  }, [activeCategory, searchQuery, hideCollected, collected, groupRingVariants]);

  const categoryProgress = useMemo(() => {
    if (activeCategory === 'Home') return null;
    let allItems: Item[];
    if (activeCategory === 'All') {
      allItems = categories.flatMap(c => data[c] as Item[]);
    } else if (activeCategory === 'Rings') {
      allItems = ringCategories.flatMap(cat => data[cat] as Item[]);
    } else {
      allItems = data[activeCategory] as Item[];
    }
    const total = allItems.length;
    const done = allItems.filter(item => collected.has(item.id)).length;
    return { done, total };
  }, [activeCategory, collected]);

  return (
    <div className="body-area flex-container space-children base-font">
      {showClearConfirm && (
        <div className="modal-overlay" onClick={cancelClear}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-warning-icon">⚠</div>
            <h2 className="modal-title">Clear All Collected?</h2>
            <p className="modal-message">
              This will permanently reset all your collected items across every category.
              <br />This action cannot be undone.
            </p>
            <div className="modal-buttons">
              <button className="button-base modal-btn-cancel" onClick={cancelClear}>Cancel</button>
              <button className="button-base modal-btn-confirm" onClick={confirmClear}>Clear All</button>
            </div>
          </div>
        </div>
      )}
      <div className="main-nav-top" style={{ flexShrink: 0, flexGrow: 0 }}>
        <div className="flex-container" style={{ height: '100%' }}>
          <button 
            className={`nav-button-base ${activeCategory === 'Home' ? 'nav-button-base-selected' : ''}`}
            onClick={() => handleCategoryChange('Home')}
          >
            Home
          </button>
          {categories.filter(c => !['Rings +1', 'Rings +2', 'Rings +3'].includes(c)).map(cat => {
            const isRingActive = cat === 'Rings' && activeCategory.startsWith('Rings');
            return (
              <button 
                key={cat}
                className={`nav-button-base ${activeCategory === cat || isRingActive ? 'nav-button-base-selected' : ''}`}
                onClick={() => handleCategoryChange(cat)}
              >
                {categoryDisplayNames[cat] || cat}
              </button>
            );
          })}
          <button 
            className={`nav-button-base ${activeCategory === 'All' ? 'nav-button-base-selected' : ''}`}
            onClick={() => handleCategoryChange('All')}
          >
            All
          </button>
        </div>
      </div>
      
      <div className="main-feature-view">
        <div className="form-wrapper" style={{ flexGrow: 1, minHeight: 0 }}>
          <div className="form-wrapper-inner vertical">
            
            {activeCategory === 'Home' ? (
              <div className="overflow-container items-search-wrapper" style={{ padding: '2em', textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
                <h1 style={{ fontFamily: "'Vollkorn SC', serif", fontSize: '2.5em', marginBottom: '0.5em', color: 'var(--font-color-lighter)' }}>
                  Dark Souls III Achievement Companion
                </h1>
                <p style={{ fontSize: '1.1em', marginBottom: '2em', color: 'var(--font-color)' }}>
                  A browser-based checklist for the collectible achievements in Dark Souls III.
                </p>
                
                <div className="white-line-separator" style={{ margin: '2em 0' }}></div>
                
                <div style={{ display: 'grid', gap: '1.5em', textAlign: 'left' }}>
                  <div>
                    <h3 style={{ color: 'var(--selection)', marginBottom: '0.5em', fontFamily: "'Vollkorn SC', serif" }}>Attributions</h3>
                    <p>
                      Game data, item descriptions, and icons sourced from the <a className="description-link" href="https://darksouls3.wiki.fextralife.com/" target="_blank" rel="noreferrer">Dark Souls 3 Wiki (Fextralife)</a>.
                      All game assets and icons are property of FromSoftware / Bandai Namco.
                    </p>
                  </div>
                  
                  <div>
                    <h3 style={{ color: 'var(--selection)', marginBottom: '0.5em', fontFamily: "'Vollkorn SC', serif" }}>Original Project</h3>
                    <p>
                      This application is a remake/clone of the original <a className="description-link" href="https://lorthiz.github.io/ds-achievement-companion/" target="_blank" rel="noreferrer">Dark Souls Achievement Companion</a> created by Lorthiz.
                    </p>
                  </div>
                  
                  <div>
                    <h3 style={{ color: 'var(--selection)', marginBottom: '0.5em', fontFamily: "'Vollkorn SC', serif" }}>Saving Progress</h3>
                    <p>
                      Your progress is automatically saved to your browser's local storage. You can safely refresh the page or return later without losing your checkmarks.
                    </p>
                  </div>
                </div>

                <div className="white-line-separator" style={{ margin: '2em 0' }}></div>
                
                <p style={{ fontStyle: 'italic', color: 'var(--font-color-darker)' }}>
                  Select a category above to begin your journey to the Platinum / 100%.
                </p>
              </div>
            ) : (
              <>
                {/* Ring variants sub-nav removed as requested */}

                <div className="filter-search-row">
                  <div className="search-input-wrapper" style={{ flexGrow: 4 }}>
                    <input 
                      className="text-input-base form-field-dark" 
                      type="search" 
                      placeholder="Start typing to filter..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ paddingRight: categoryProgress ? '5em' : undefined }}
                    />
                    {categoryProgress && (
                      <span className="search-progress-overlay">
                        {categoryProgress.done} / {categoryProgress.total}
                      </span>
                    )}
                  </div>
                  {activeCategory === 'Rings' && (
                    <button
                      className={`button-base truncate-label${groupRingVariants ? ' button-base-active' : ''}`}
                      onClick={toggleGroupRingVariants}
                      style={{ minWidth: '8em', lineHeight: '1' }}
                    >
                      {groupRingVariants ? 'Grouped ✦' : 'Grouped'}
                    </button>
                  )}
                  <button className="button-base truncate-label" onClick={clearCollected}>
                    Clear collected
                  </button>
                  <button 
                    className={`button-base truncate-label${hideCollected ? ' button-base-active' : ''}`} 
                    onClick={toggleHideCollected} 
                    style={{ width: '13em', lineHeight: '1' }}
                  >
                    {hideCollected ? 'Hide Collected ✦' : 'Hide Collected'}
                  </button>
                </div>
                <div className="white-line-separator"></div>

                <div className="overflow-container items-search-wrapper">
                  {displayedData.map(group => (
                    <React.Fragment key={group.category}>
                      <h1>{categoryDisplayNames[group.category] || group.category}</h1>
                      
                      {group.items.map((item: Item) => {
                        const isCollected = collected.has(item.id);
                        return (
                          <div key={item.id} className={`single-item-record-wrapper ${isCollected ? 'collected' : ''}`}>
                            <div className="item-main-col" title={item.name}>
                              {item.icon && (
                                <a className="title-link" target="_blank" href={item.wikiLink} rel="noreferrer">
                                  <img src={item.icon} alt={`${item.name} icon`} style={{ width: '4em', height: '4em', objectFit: 'contain' }} />
                                </a>
                              )}
                              <a className="title-link" target="_blank" href={item.wikiLink} rel="noreferrer" style={{ marginLeft: '1em' }}>{item.name}</a>
                            </div>
                            
                            <div
                              className={`description-container ${item.requirement ? 'with-requirement' : ''}`}
                              dangerouslySetInnerHTML={{ __html: sanitizeDescriptionHtml(item.description || '') }}
                            ></div>
                            
                            {item.requirement && (
                              <div className="requirement-col">
                                  <>
                                    <span style={{ textAlign: 'right', marginRight: '0.5em', fontSize: '0.9em', color: 'var(--font-color)' }}>
                                      Requires<br/>
                                      <a className="description-link" href={item.requirement.url} target="_blank" rel="noreferrer">
                                        {item.requirement.name}
                                      </a>
                                    </span>
                                    <a href={item.requirement.url} target="_blank" rel="noreferrer">
                                      <img src={item.requirement.icon} alt={item.requirement.name} style={{ width: '3em', height: '3em', objectFit: 'contain' }} />
                                    </a>
                                  </>
                              </div>
                            )}
                            
                            <button 
                              className="button-base" 
                              onClick={() => toggleItem(item.id)}
                            >
                              {isCollected ? 'Un-Collect' : 'Collect'}
                            </button>
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
}
