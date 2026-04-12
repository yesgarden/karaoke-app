'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Song = {
  id: string;
  title: string;
  genre: 'Kpop' | 'Jpop' | 'Vocaloid' | 'Pop';
  skill_level: '불가능' | '후렴 숙련' | '반숙' | '숙련';
  key_difficulty: '모름' | '불가능' | '차력쇼' | '어려움' | '보통' | '쉬움';
  key_difficulty_star: boolean;
  speed_pressure: boolean;
  source: string;
  aliases: string | null;
  weeks_since_last_sung: number;
  note: string | null;
};

const GENRES = ['Kpop', 'Jpop', 'Vocaloid', 'Pop'] as const;
const SKILL_LEVELS = ['불가능', '후렴 숙련', '반숙', '숙련'] as const;
const KEY_DIFFICULTIES = ['모름', '불가능', '차력쇼', '어려움', '보통', '쉬움'] as const;
const SPEED_OPTIONS = ['O', 'X'] as const;
const SOURCE_OPTIONS = ['USB', '번호'] as const;

const skillColorMap: Record<string, { bg: string; text: string }> = {
  '숙련': { bg: '#1e3a8a', text: '#bfdbfe' },
  '반숙': { bg: '#78350f', text: '#fde68a' },
  '후렴 숙련': { bg: '#7f1d1d', text: '#fecaca' },
  '불가능': { bg: '#3f3f46', text: '#e4e4e7' },
};

const keyColorMap: Record<string, { bg: string; text: string }> = {
  '모름': { bg: '#52525b', text: '#f4f4f5' },
  '쉬움': { bg: '#1e3a8a', text: '#bfdbfe' },
  '보통': { bg: '#14532d', text: '#bbf7d0' },
  '어려움': { bg: '#581c87', text: '#e9d5ff' },
  '차력쇼': { bg: '#7f1d1d', text: '#fecaca' },
  '불가능': { bg: '#3f3f46', text: '#e4e4e7' },
};

const genreColorMap: Record<string, { bg: string; text: string }> = {
  'Pop': { bg: '#1e3a8a', text: '#bfdbfe' },
  'Vocaloid': { bg: '#166534', text: '#bbf7d0' },
  'Jpop': { bg: '#6b21a8', text: '#e9d5ff' },
  'Kpop': { bg: '#553322', text: '#fed7aa' },
};

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#0b0b0f',
    color: '#f5f5f5',
    padding: '24px 16px 40px',
    fontFamily: 'Arial, sans-serif',
  } as React.CSSProperties,

  container: {
    maxWidth: '960px',
    margin: '0 auto',
  } as React.CSSProperties,

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
    marginBottom: '20px',
  } as React.CSSProperties,

  titleWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  } as React.CSSProperties,

  title: {
    fontSize: '32px',
    fontWeight: 700,
    margin: 0,
  } as React.CSSProperties,

  subtitle: {
    color: '#a1a1aa',
    fontSize: '14px',
  } as React.CSSProperties,

  primaryButton: {
    backgroundColor: '#ffffff',
    color: '#111111',
    border: 'none',
    borderRadius: '999px',
    padding: '12px 18px',
    fontWeight: 700,
    cursor: 'pointer',
  } as React.CSSProperties,

  filterPanel: {
    backgroundColor: '#15151b',
    border: '1px solid #27272a',
    borderRadius: '20px',
    padding: '18px',
    marginBottom: '18px',
  } as React.CSSProperties,

  filterSection: {
    marginBottom: '18px',
  } as React.CSSProperties,

  label: {
    fontSize: '14px',
    fontWeight: 700,
    marginBottom: '10px',
  } as React.CSSProperties,

  chipRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  } as React.CSSProperties,

  chip: {
    border: '1px solid #3f3f46',
    backgroundColor: '#23232b',
    color: '#f4f4f5',
    borderRadius: '999px',
    padding: '8px 12px',
    cursor: 'pointer',
    fontSize: '14px',
  } as React.CSSProperties,

  chipActive: {
    backgroundColor: '#f4f4f5',
    color: '#111111',
    border: '1px solid #f4f4f5',
  } as React.CSSProperties,

  searchInput: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '16px 18px',
    borderRadius: '18px',
    border: '1px solid #3f3f46',
    backgroundColor: '#0f0f14',
    color: '#ffffff',
    fontSize: '16px',
    outline: 'none',
  } as React.CSSProperties,

  detailsToggleButton: {
    background: 'transparent',
    border: 'none',
    color: '#c4c4cc',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    padding: 0,
    marginTop: '12px',
  } as React.CSSProperties,

  sortBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '18px',
    flexWrap: 'wrap',
  } as React.CSSProperties,

  select: {
    minWidth: '180px',
    padding: '10px 12px',
    borderRadius: '12px',
    border: '1px solid #3f3f46',
    backgroundColor: '#0f0f14',
    color: '#ffffff',
    fontSize: '14px',
  } as React.CSSProperties,

  resultTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '14px',
    gap: '10px',
    flexWrap: 'wrap',
  } as React.CSSProperties,

  resultCount: {
    color: '#a1a1aa',
    fontSize: '14px',
  } as React.CSSProperties,

  songList: {
    display: 'grid',
    gap: '12px',
  } as React.CSSProperties,

  songCard: {
    backgroundColor: '#15151b',
    border: '1px solid #27272a',
    borderRadius: '18px',
    padding: '16px',
  } as React.CSSProperties,

  songTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
    marginBottom: '10px',
  } as React.CSSProperties,

  songTitleWrap: {
    minWidth: 0,
  } as React.CSSProperties,

  songTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
    marginBottom: '6px',
  } as React.CSSProperties,

  songTitle: {
    fontSize: '20px',
    fontWeight: 700,
    wordBreak: 'break-word',
  } as React.CSSProperties,

  noteToggleTop: {
    background: 'transparent',
    border: '1px solid #3f3f46',
    color: '#a1a1aa',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
    borderRadius: '999px',
    padding: '4px 8px',
    lineHeight: 1,
  } as React.CSSProperties,

  songMeta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  } as React.CSSProperties,

  badge: {
    display: 'inline-block',
    fontSize: '13px',
    padding: '6px 10px',
    borderRadius: '999px',
    backgroundColor: '#23232b',
    border: '1px solid #3f3f46',
    color: '#e4e4e7',
  } as React.CSSProperties,

  weekBadge: {
    display: 'inline-block',
    fontSize: '14px',
    padding: '8px 12px',
    borderRadius: '999px',
    whiteSpace: 'nowrap',
  } as React.CSSProperties,

  note: {
    marginTop: '12px',
    color: '#c4c4cc',
    fontSize: '14px',
    lineHeight: 1.5,
    whiteSpace: 'pre-wrap',
    backgroundColor: '#101014',
    border: '1px solid #27272a',
    borderRadius: '12px',
    padding: '12px',
  } as React.CSSProperties,

  cardBottom: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '10px',
    marginTop: '14px',
    flexWrap: 'wrap',
  } as React.CSSProperties,

  sourceText: {
    fontSize: '13px',
    color: '#a1a1aa',
  } as React.CSSProperties,

  buttonGroup: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  } as React.CSSProperties,

  secondaryButton: {
    backgroundColor: '#27272a',
    color: '#ffffff',
    border: '1px solid #3f3f46',
    borderRadius: '999px',
    padding: '10px 14px',
    fontWeight: 700,
    cursor: 'pointer',
  } as React.CSSProperties,

  empty: {
    padding: '24px',
    textAlign: 'center',
    color: '#a1a1aa',
    backgroundColor: '#15151b',
    border: '1px solid #27272a',
    borderRadius: '18px',
  } as React.CSSProperties,
};

export default function Home() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedKeyDifficulties, setSelectedKeyDifficulties] = useState<string[]>([]);
  const [selectedSpeedOptions, setSelectedSpeedOptions] = useState<string[]>([]);
  const [selectedSourceOptions, setSelectedSourceOptions] = useState<string[]>([]);
  const [sortOption, setSortOption] = useState<'default' | 'recent' | 'oldest'>('default');
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [openNotes, setOpenNotes] = useState<string[]>([]);

  useEffect(() => {
    fetchSongs();
  }, []);

  async function fetchSongs() {
    const { data, error } = await supabase.from('songs').select('*');

    if (error) {
      console.error('곡 목록 불러오기 실패:', error);
      return;
    }

    setSongs((data as Song[]) || []);
  }

  async function markAsSung(id: string) {
    const { error } = await supabase
      .from('songs')
      .update({ weeks_since_last_sung: 0 })
      .eq('id', id);

    if (error) {
      console.error('주차 초기화 실패:', error);
      return;
    }

    fetchSongs();
  }

  async function incrementWeek() {
    const { error } = await supabase.rpc('increment_all_weeks');

    if (error) {
      console.error('주차 증가 실패:', error);
      return;
    }

    fetchSongs();
  }

  function toggleItem(
    value: string,
    setList: React.Dispatch<React.SetStateAction<string[]>>
  ) {
    setList((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  }

  function toggleNote(id: string) {
    setOpenNotes((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  }

  const filteredSongs = useMemo(() => {
    let result = [...songs];

    if (selectedGenres.length > 0) {
      result = result.filter((song) => selectedGenres.includes(song.genre));
    }

    if (selectedSkills.length > 0) {
      result = result.filter((song) => selectedSkills.includes(song.skill_level));
    }

    if (selectedKeyDifficulties.length > 0) {
      result = result.filter((song) =>
        selectedKeyDifficulties.includes(song.key_difficulty)
      );
    }

    if (selectedSpeedOptions.length > 0) {
      result = result.filter((song) => {
        const value = song.speed_pressure ? 'O' : 'X';
        return selectedSpeedOptions.includes(value);
      });
    }

    if (selectedSourceOptions.length > 0) {
      result = result.filter((song) => {
        const value = song.source === 'USB' ? 'USB' : '번호';
        return selectedSourceOptions.includes(value);
      });
    }

    const keyword = search.trim().toLowerCase();
    if (keyword) {
      result = result.filter((song) => {
        const title = song.title.toLowerCase();
        const aliases = (song.aliases ?? '').toLowerCase();
        return title.includes(keyword) || aliases.includes(keyword);
      });
    }

    if (sortOption === 'recent') {
      result.sort((a, b) => a.weeks_since_last_sung - b.weeks_since_last_sung);
    } else if (sortOption === 'oldest') {
      result.sort((a, b) => b.weeks_since_last_sung - a.weeks_since_last_sung);
    }

    return result;
  }, [
    songs,
    selectedGenres,
    selectedSkills,
    selectedKeyDifficulties,
    selectedSpeedOptions,
    selectedSourceOptions,
    sortOption,
    search,
  ]);

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.titleWrap}>
            <h1 style={styles.title}>노래책</h1>
            <div style={styles.subtitle}>부를 곡을 고르고, 부른 곡은 바로 체크</div>
          </div>

          <button onClick={incrementWeek} style={styles.primaryButton}>
            이번 주 노래방 감
          </button>
        </div>

        <div style={styles.filterPanel}>
          <div style={styles.filterSection}>
            <div style={styles.label}>검색</div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="제목 / 별칭 검색"
              style={styles.searchInput}
            />

            <button
              onClick={() => setShowFilters((prev) => !prev)}
              style={styles.detailsToggleButton}
            >
              상세 설정 {showFilters ? '▼' : '>'}
            </button>
          </div>

          {showFilters && (
            <>
              <div style={styles.filterSection}>
                <div style={styles.label}>장르</div>
                <div style={styles.chipRow}>
                  {GENRES.map((genre) => {
                    const active = selectedGenres.includes(genre);
                    return (
                      <button
                        key={genre}
                        onClick={() => toggleItem(genre, setSelectedGenres)}
                        style={{ ...styles.chip, ...(active ? styles.chipActive : {}) }}
                      >
                        {genre}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={styles.filterSection}>
                <div style={styles.label}>숙련도</div>
                <div style={styles.chipRow}>
                  {SKILL_LEVELS.map((skill) => {
                    const active = selectedSkills.includes(skill);
                    return (
                      <button
                        key={skill}
                        onClick={() => toggleItem(skill, setSelectedSkills)}
                        style={{ ...styles.chip, ...(active ? styles.chipActive : {}) }}
                      >
                        {skill}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={styles.filterSection}>
                <div style={styles.label}>원키 난이도</div>
                <div style={styles.chipRow}>
                  {KEY_DIFFICULTIES.map((difficulty) => {
                    const active = selectedKeyDifficulties.includes(difficulty);
                    return (
                      <button
                        key={difficulty}
                        onClick={() => toggleItem(difficulty, setSelectedKeyDifficulties)}
                        style={{ ...styles.chip, ...(active ? styles.chipActive : {}) }}
                      >
                        {difficulty}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={styles.filterSection}>
                <div style={styles.label}>속도 압박</div>
                <div style={styles.chipRow}>
                  {SPEED_OPTIONS.map((value) => {
                    const active = selectedSpeedOptions.includes(value);
                    return (
                      <button
                        key={value}
                        onClick={() => toggleItem(value, setSelectedSpeedOptions)}
                        style={{ ...styles.chip, ...(active ? styles.chipActive : {}) }}
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={styles.filterSection}>
                <div style={styles.label}>USB / 번호</div>
                <div style={styles.chipRow}>
                  {SOURCE_OPTIONS.map((value) => {
                    const active = selectedSourceOptions.includes(value);
                    return (
                      <button
                        key={value}
                        onClick={() => toggleItem(value, setSelectedSourceOptions)}
                        style={{ ...styles.chip, ...(active ? styles.chipActive : {}) }}
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        <div style={styles.sortBox}>
          <div style={styles.label}>정렬</div>
          <select
            value={sortOption}
            onChange={(e) =>
              setSortOption(e.target.value as 'default' | 'recent' | 'oldest')
            }
            style={styles.select}
          >
            <option value="default">기본 정렬</option>
            <option value="recent">최신순</option>
            <option value="oldest">오래된 순</option>
          </select>
        </div>

        <div style={styles.resultTop}>
          <div style={styles.resultCount}>총 {filteredSongs.length}곡</div>
        </div>

        {filteredSongs.length === 0 ? (
          <div style={styles.empty}>조건에 맞는 곡이 없음</div>
        ) : (
          <div style={styles.songList}>
            {filteredSongs.map((song) => (
              <div key={song.id} style={styles.songCard}>
                <div style={styles.songTop}>
                  <div style={styles.songTitleWrap}>
                    <div style={styles.songTitleRow}>
                      <div style={styles.songTitle}>{song.title}</div>

                      {song.note && (
                        <button
                          onClick={() => toggleNote(song.id)}
                          style={styles.noteToggleTop}
                        >
                          {openNotes.includes(song.id) ? '📝 닫기' : '📝 비고'}
                        </button>
                      )}
                    </div>

                    <div style={styles.songMeta}>
                      <span
                        style={{
                          ...styles.badge,
                          backgroundColor: genreColorMap[song.genre].bg,
                          color: genreColorMap[song.genre].text,
                        }}
                      >
                        {song.genre}
                      </span>

                      <span
                        style={{
                          ...styles.badge,
                          backgroundColor: skillColorMap[song.skill_level].bg,
                          color: skillColorMap[song.skill_level].text,
                        }}
                      >
                        {song.skill_level}
                      </span>

                      <span
                        style={{
                          ...styles.badge,
                          backgroundColor: keyColorMap[song.key_difficulty].bg,
                          color: keyColorMap[song.key_difficulty].text,
                        }}
                      >
                        {song.key_difficulty}
                        {song.key_difficulty_star ? '*' : ''}
                      </span>

                      <span style={styles.badge}>
                        속도 {song.speed_pressure ? 'O' : 'X'}
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      ...styles.weekBadge,
                      backgroundColor:
                        song.weeks_since_last_sung >= 5
                          ? '#7f1d1d'
                          : song.weeks_since_last_sung >= 2
                            ? '#78350f'
                            : '#14532d',
                      color:
                        song.weeks_since_last_sung >= 5
                          ? '#fecaca'
                          : song.weeks_since_last_sung >= 2
                            ? '#fde68a'
                            : '#bbf7d0',
                    }}
                  >
                    {song.weeks_since_last_sung}주 전
                  </div>
                </div>

                <div style={styles.cardBottom}>
                  <div style={styles.sourceText}>
                    {song.source === 'USB' ? 'USB' : `${song.source}`}
                  </div>

                  <div style={styles.buttonGroup}>
                    <button
                      onClick={() => markAsSung(song.id)}
                      style={styles.secondaryButton}
                    >
                      불렀다
                    </button>
                  </div>
                </div>

                {song.note && openNotes.includes(song.id) && (
                  <div style={styles.note}>{song.note}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}