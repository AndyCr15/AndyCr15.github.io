/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import {
  auth,
  subscribeToUserCharacters,
  addCharacterDoc,
  updateCharacterDoc,
  deleteCharacterDoc,
  addBookToCharacters,
  renameBookInCharacters,
  deleteBookFromCharacters,
  saveSeriesBookOrder,
  deleteSeriesOrderFromFirestore,
  subscribeToSeriesOrders,
  saveReadingList,
  subscribeToReadingList,
  subscribeToBookTimestamps,
  subscribeToBookSeries,
  updateBookSeriesInFirestore,
  seedSampleClassicCharacters,
  batchImportCharacters,
  ImportResolutionMode,
  TagInteractions,
  subscribeToTagInteractions,
  saveTagInteractions,
} from './lib/firebase';
import type { Character, ListingViewType } from './types';
import {
  filterCharacters,
  filterBookGroups,
  filterSeriesGroups,
  groupCharactersBySeries,
  getUniqueSuggestions,
  getCharacterSeries,
} from './lib/grouping';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { SearchAndFilters } from './components/SearchAndFilters';
import { CharactersList } from './components/CharactersList';
import { BooksList } from './components/BooksList';
import { SeriesList } from './components/SeriesList';
import { CharacterModal } from './components/CharacterModal';
import { AddBookModal } from './components/AddBookModal';
import { EditBookModal } from './components/EditBookModal';
import { DeleteBookModal } from './components/DeleteBookModal';
import { CharacterDetailModal } from './components/CharacterDetailModal';
import { DeleteConfirmationModal } from './components/DeleteConfirmationModal';
import { CsvExportModal } from './components/CsvExportModal';
import { CsvImportModal } from './components/CsvImportModal';
import { AuthGate } from './components/AuthGate';
import { EmptyState } from './components/EmptyState';
import { BookOpen } from 'lucide-react';

function AppContent() {
  const [user, setUser] = React.useState<User | null>(null);
  const [authLoading, setAuthLoading] = React.useState(true);
  const [characters, setCharacters] = React.useState<Character[]>([]);
  const [dataLoading, setDataLoading] = React.useState(true);
  const [isSeeding, setIsSeeding] = React.useState(false);
  const [seriesOrders, setSeriesOrders] = React.useState<Record<string, string[]>>({});
  const [bookTimestamps, setBookTimestamps] = React.useState<Record<string, number>>({});
  const [readingList, setReadingList] = React.useState<string[]>([]);
  const [bookSeriesMap, setBookSeriesMap] = React.useState<Record<string, string[]>>({});
  const [tagInteractions, setTagInteractions] = React.useState<TagInteractions | null>(null);

  // View & Search State
  const [activeView, setActiveView] = React.useState<ListingViewType>('characters');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [titlesOnly, setTitlesOnly] = React.useState(false);

  // Modals
  const [characterModal, setCharacterModal] = React.useState<{
    isOpen: boolean;
    initialData: Character | null;
    defaultBook?: string;
    defaultSeries?: string;
  }>({
    isOpen: false,
    initialData: null,
  });

  const [isAddBookModalOpen, setIsAddBookModalOpen] = React.useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = React.useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = React.useState(false);
  const [detailCharacter, setDetailCharacter] = React.useState<Character | null>(null);
  const [characterToDelete, setCharacterToDelete] = React.useState<Character | null>(null);

  // Book edit & delete modals
  const [bookToEdit, setBookToEdit] = React.useState<{
    isOpen: boolean;
    bookTitle: string;
    characterCount: number;
  }>({
    isOpen: false,
    bookTitle: '',
    characterCount: 0,
  });

  const [bookToDelete, setBookToDelete] = React.useState<{
    isOpen: boolean;
    bookTitle: string;
    characterCount: number;
  }>({
    isOpen: false,
    bookTitle: '',
    characterCount: 0,
  });

  // Listen to Auth State
  React.useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (!currentUser) {
        setCharacters([]);
        setDataLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Listen to Firestore Characters for current user
  React.useEffect(() => {
    if (!user) return;

    setDataLoading(true);
    const unsubscribeSnapshot = subscribeToUserCharacters(
      user.uid,
      (fetchedCharacters) => {
        setCharacters(fetchedCharacters);
        setDataLoading(false);
      },
      (error) => {
        console.error('Failed to load characters:', error);
        setDataLoading(false);
      }
    );

    const unsubscribeSeriesOrders = subscribeToSeriesOrders(
      user.uid,
      (fetchedOrders) => {
        setSeriesOrders(fetchedOrders);
      }
    );

    const unsubscribeReadingList = subscribeToReadingList(
      user.uid,
      (fetchedReadingList) => {
        setReadingList(fetchedReadingList);
      }
    );

    const unsubscribeBookTimestamps = subscribeToBookTimestamps(
      user.uid,
      (fetchedTimestamps) => {
        setBookTimestamps(fetchedTimestamps);
      }
    );

    const unsubscribeBookSeries = subscribeToBookSeries(
      user.uid,
      (fetchedBookSeries) => {
        setBookSeriesMap(fetchedBookSeries);
      }
    );

    const unsubscribeTagInteractions = subscribeToTagInteractions(
      user.uid,
      (fetchedInteractions) => {
        setTagInteractions(fetchedInteractions);
      }
    );

    return () => {
      unsubscribeSnapshot();
      unsubscribeSeriesOrders();
      unsubscribeReadingList();
      unsubscribeBookTimestamps();
      unsubscribeBookSeries();
      unsubscribeTagInteractions();
    };
  }, [user]);

  // Ensure Book Series with no books tagged are removed from seriesOrders in Firestore and state
  React.useEffect(() => {
    if (!user || Object.keys(seriesOrders).length === 0) return;

    // Find all series currently tagged on at least one book
    const taggedSeries = new Set<string>();
    Object.entries(bookSeriesMap).forEach(([b, sArr]) => {
      if (b.trim() && Array.isArray(sArr)) {
        sArr.forEach((s) => {
          if (s && s.trim()) taggedSeries.add(s.trim());
        });
      }
    });
    characters.forEach((c) => {
      const cBooks = Array.isArray(c.books) && c.books.length > 0 ? c.books : (c.book ? [c.book] : []);
      if (cBooks.length > 0) {
        const derived = getCharacterSeries(c, bookSeriesMap);
        derived.forEach((s) => {
          if (s && s.trim()) taggedSeries.add(s.trim());
        });
      }
    });

    const orphanSeries = Object.keys(seriesOrders).filter(
      (s) => s && s !== 'Standalone / No Series' && !taggedSeries.has(s)
    );

    if (orphanSeries.length > 0) {
      orphanSeries.forEach((sName) => {
        deleteSeriesOrderFromFirestore(user.uid, sName).catch(console.error);
      });
      setSeriesOrders((prev) => {
        const next = { ...prev };
        orphanSeries.forEach((s) => delete next[s]);
        return next;
      });
    }
  }, [user, seriesOrders, bookSeriesMap, characters]);

  // Stable series list for the book currently being edited
  const bookToEditSeries = React.useMemo(() => {
    if (!bookToEdit.isOpen || !bookToEdit.bookTitle) return [];
    return bookSeriesMap[bookToEdit.bookTitle] || [];
  }, [bookToEdit.isOpen, bookToEdit.bookTitle, bookSeriesMap]);

  // Suggestions for autocomplete & filter chips (with Top 2 MRU based on user click/add interaction recency)
  const { books: existingBooks, series: existingSeries } = React.useMemo(() => {
    return getUniqueSuggestions(characters, bookSeriesMap, tagInteractions);
  }, [characters, bookSeriesMap, tagInteractions]);

  // Filtered characters based on search query
  const filteredCharacters = React.useMemo(() => {
    return filterCharacters(characters, searchQuery, titlesOnly, bookSeriesMap);
  }, [characters, searchQuery, titlesOnly, bookSeriesMap]);

  // Filtered book and series groups for accurate listing and tab badge counts
  const filteredBookGroups = React.useMemo(() => {
    return filterBookGroups(characters, searchQuery, titlesOnly, bookSeriesMap);
  }, [characters, searchQuery, titlesOnly, bookSeriesMap]);

  const filteredSeriesGroups = React.useMemo(() => {
    return filterSeriesGroups(characters, searchQuery, titlesOnly, seriesOrders, bookTimestamps, bookSeriesMap);
  }, [characters, searchQuery, titlesOnly, seriesOrders, bookTimestamps, bookSeriesMap]);

  // Dynamic counts across books, series, and characters
  const counts = React.useMemo(() => {
    return {
      characters: filteredCharacters.length,
      books: filteredBookGroups.length,
      series: filteredSeriesGroups.filter(
        (s) => s.seriesName !== 'Standalone / No Series' || s.totalCharacters > 0
      ).length,
    };
  }, [filteredCharacters, filteredBookGroups, filteredSeriesGroups]);

  // Record user tag interactions to maintain Top 2 MRU across Books and Book Series
  const handleRecordTagInteraction = React.useCallback(
    (type: 'book' | 'series', name: string) => {
      if (!user) return;
      const clean = name.trim();
      if (!clean) return;

      setTagInteractions((prev) => {
        const next: TagInteractions = {
          books: { ...(prev?.books || {}) },
          series: { ...(prev?.series || {}) },
        };
        const now = Date.now();
        if (type === 'book') {
          next.books[clean] = now;
        } else {
          next.series[clean] = now;
        }
        saveTagInteractions(user.uid, next).catch((err) =>
          console.error('Failed to save tag interaction:', err)
        );
        return next;
      });
    },
    [user]
  );

  // Handlers
  const handleOpenAddModal = (defaultBook?: string, defaultSeries?: string) => {
    setCharacterModal({
      isOpen: true,
      initialData: null,
      defaultBook,
      defaultSeries,
    });
  };

  const handleOpenEditModal = (character: Character) => {
    setCharacterModal({
      isOpen: true,
      initialData: character,
    });
  };

  const handleCloseModal = () => {
    setCharacterModal({
      isOpen: false,
      initialData: null,
      defaultBook: undefined,
      defaultSeries: undefined,
    });
  };

  const handleSaveCharacter = async (
    charData: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    if (!user) return;

    if (characterModal.initialData) {
      await updateCharacterDoc(user.uid, characterModal.initialData.id, charData);
      // Update selected detail modal character if currently opened
      if (detailCharacter && detailCharacter.id === characterModal.initialData.id) {
        setDetailCharacter({
          ...detailCharacter,
          ...charData,
          updatedAt: Date.now(),
        });
      }
    } else {
      await addCharacterDoc(user.uid, charData);
    }
  };

  const handleRequestDelete = (character: Character) => {
    setCharacterToDelete(character);
  };

  const handleConfirmDelete = async (character: Character) => {
    if (!user) return;
    await deleteCharacterDoc(user.uid, character.id);
    if (detailCharacter?.id === character.id) {
      setDetailCharacter(null);
    }
  };

  const handleOpenEditBook = (bookTitle: string, characterCount: number) => {
    setBookToEdit({
      isOpen: true,
      bookTitle,
      characterCount,
    });
  };

  const handleOpenDeleteBook = (bookTitle: string, characterCount: number) => {
    setBookToDelete({
      isOpen: true,
      bookTitle,
      characterCount,
    });
  };

  const handleSaveEditedBook = async (oldTitle: string, newTitle: string, seriesList?: string[]) => {
    if (!user) return;
    await renameBookInCharacters(user.uid, oldTitle, newTitle, characters, bookSeriesMap);
    if (seriesList !== undefined) {
      await updateBookSeriesInFirestore(user.uid, newTitle, seriesList, bookSeriesMap);
    }
    // Also if oldTitle was in seriesOrders, update that
    setSeriesOrders((prev) => {
      const updated: Record<string, string[]> = {};
      Object.entries(prev).forEach(([sName, order]) => {
        if (Array.isArray(order)) {
          updated[sName] = order.map((b) => (b === oldTitle ? newTitle : b));
        }
      });
      return updated;
    });

    // Also update readingList if oldTitle was in it
    if (readingList.includes(oldTitle)) {
      const updatedReadingList = readingList.map((b) => (b === oldTitle ? newTitle : b));
      setReadingList(updatedReadingList);
      await saveReadingList(user.uid, updatedReadingList);
    }
  };

  const handleConfirmDeleteBook = async (bookTitle: string) => {
    if (!user) return;
    await deleteBookFromCharacters(user.uid, bookTitle, characters, bookSeriesMap);
    // Also clean up from series orders
    setSeriesOrders((prev) => {
      const updated: Record<string, string[]> = {};
      Object.entries(prev).forEach(([sName, order]) => {
        if (Array.isArray(order)) {
          updated[sName] = order.filter((b) => b !== bookTitle);
        }
      });
      return updated;
    });

    // Also remove from readingList
    if (readingList.includes(bookTitle)) {
      const updatedReadingList = readingList.filter((b) => b !== bookTitle);
      setReadingList(updatedReadingList);
      await saveReadingList(user.uid, updatedReadingList);
    }
  };

  const handleToggleReadingNow = async (bookTitle: string) => {
    const cleanTitle = bookTitle.trim();
    if (!cleanTitle) return;

    const isCurrentlyReading = readingList.includes(cleanTitle);
    const updatedList = isCurrentlyReading
      ? readingList.filter((b) => b !== cleanTitle)
      : [...readingList, cleanTitle];

    setReadingList(updatedList);

    if (user) {
      await saveReadingList(user.uid, updatedList);
    }
  };

  const handleMoveBookInSeries = async (
    seriesName: string,
    bookTitle: string,
    direction: 'up' | 'down'
  ) => {
    // Get current series books in their current display order
    const allGroups = groupCharactersBySeries(characters, seriesOrders, bookTimestamps, bookSeriesMap);
    const targetGroup = allGroups.find((g) => g.seriesName === seriesName);
    if (!targetGroup) return;

    const currentBooks = targetGroup.books.map((b) => b.bookTitle);
    const currentIndex = currentBooks.indexOf(bookTitle);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= currentBooks.length) return;

    const newOrder = [...currentBooks];
    const [moved] = newOrder.splice(currentIndex, 1);
    newOrder.splice(targetIndex, 0, moved);

    setSeriesOrders((prev) => ({
      ...prev,
      [seriesName]: newOrder,
    }));

    if (user) {
      await saveSeriesBookOrder(user.uid, seriesName, newOrder);
    }
  };

  const handleSaveBook = async (
    bookTitle: string,
    seriesName: string | string[] | undefined,
    selectedCharacterIds: string[],
    newCharacters?: { name: string; role?: string; description?: string }[]
  ) => {
    if (!user) return;
    const primarySeries = Array.isArray(seriesName) ? seriesName[0] : seriesName;
    const currentOrder = primarySeries && seriesOrders[primarySeries] ? seriesOrders[primarySeries] : undefined;
    await addBookToCharacters(
      user.uid,
      bookTitle,
      seriesName,
      selectedCharacterIds,
      characters,
      newCharacters,
      currentOrder,
      bookSeriesMap
    );
  };

  const handleSeedSamples = async () => {
    if (!user) return;
    try {
      setIsSeeding(true);
      await seedSampleClassicCharacters(user.uid);
    } catch (err) {
      console.error('Failed to seed sample characters:', err);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleBatchImport = async (
    rows: any[],
    mode: ImportResolutionMode
  ) => {
    if (!user) {
      throw new Error('Please sign in to import character records into your cloud library.');
    }
    return await batchImportCharacters(user.uid, rows, characters, mode);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F8F4EE] dark:bg-[#1A110A] flex flex-col items-center justify-center p-4 transition-colors">
        <div className="w-12 h-12 rounded-xl bg-[#59371C] dark:bg-[#8D582D] text-[#FAF5EE] flex items-center justify-center shadow-lg animate-pulse mb-3">
          <BookOpen className="w-6 h-6" />
        </div>
        <p className="text-sm font-heading font-semibold text-[#54351B] dark:text-[#E8D4C1]">
          Opening Character Arc...
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F8F4EE] dark:bg-[#1A110A] flex flex-col transition-colors">
        <Navbar
          user={null}
          loading={authLoading}
          totalCharacters={0}
        />
        <main className="flex-1">
          <AuthGate />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F4EE] dark:bg-[#1A110A] flex flex-col text-[#38220F] dark:text-[#EDE1D2] font-serif transition-colors duration-200">
      {/* Top Header */}
      <Navbar
        user={user}
        loading={authLoading}
        totalCharacters={characters.length}
        onSeedSampleData={handleSeedSamples}
        isSeeding={isSeeding}
        onOpenExport={() => setIsExportModalOpen(true)}
        onOpenImport={() => setIsImportModalOpen(true)}
      />

      {/* Main Search & Listing Tabs */}
      <SearchAndFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        titlesOnly={titlesOnly}
        onTitlesOnlyChange={setTitlesOnly}
        activeView={activeView}
        onViewChange={setActiveView}
        counts={counts}
        onOpenAddModal={() => handleOpenAddModal()}
        onOpenAddBookModal={() => setIsAddBookModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {dataLoading ? (
          <div className="text-center py-16">
            <div className="w-10 h-10 rounded-lg bg-[#613D22] dark:bg-[#8D582D] text-[#FAF5EE] flex items-center justify-center mx-auto mb-3 shadow animate-spin">
              <BookOpen className="w-5 h-5" />
            </div>
            <p className="text-sm text-[#70523C] dark:text-[#A68F7B] font-sans-ui">
              Synchronizing your cloud character chronicles...
            </p>
          </div>
        ) : characters.length === 0 ? (
          <EmptyState
            onAddCharacter={() => handleOpenAddModal()}
            onSeedSamples={handleSeedSamples}
            isSeeding={isSeeding}
          />
        ) : (
          <div>
            {/* View Selector Display */}
            {activeView === 'characters' && (
              <CharactersList
                characters={filteredCharacters}
                searchQuery={searchQuery}
                bookSeriesMap={bookSeriesMap}
                onEdit={handleOpenEditModal}
                onDelete={handleRequestDelete}
                onSelect={(char) => setDetailCharacter(char)}
                onOpenAddModal={() => handleOpenAddModal()}
              />
            )}

            {activeView === 'books' && (
              <BooksList
                characters={characters}
                searchQuery={searchQuery}
                titlesOnly={titlesOnly}
                readingList={readingList}
                bookSeriesMap={bookSeriesMap}
                onToggleReadingNow={handleToggleReadingNow}
                onEdit={handleOpenEditModal}
                onDelete={handleRequestDelete}
                onSelect={(char) => setDetailCharacter(char)}
                onAddCharacterToBook={(bookTitle, seriesName) =>
                  handleOpenAddModal(bookTitle, seriesName)
                }
                onEditBook={handleOpenEditBook}
                onDeleteBook={handleOpenDeleteBook}
              />
            )}

            {activeView === 'series' && (
              <SeriesList
                characters={characters}
                searchQuery={searchQuery}
                titlesOnly={titlesOnly}
                seriesOrders={seriesOrders}
                bookTimestamps={bookTimestamps}
                readingList={readingList}
                bookSeriesMap={bookSeriesMap}
                onToggleReadingNow={handleToggleReadingNow}
                onEdit={handleOpenEditModal}
                onDelete={handleRequestDelete}
                onSelect={(char) => setDetailCharacter(char)}
                onAddCharacterToSeries={(seriesName, bookTitle) =>
                  handleOpenAddModal(bookTitle, seriesName)
                }
                onEditBook={handleOpenEditBook}
                onDeleteBook={handleOpenDeleteBook}
                onMoveBookInSeries={handleMoveBookInSeries}
              />
            )}
          </div>
        )}
      </main>

      {/* Edit Book Modal */}
      <EditBookModal
        isOpen={bookToEdit.isOpen}
        bookTitle={bookToEdit.bookTitle}
        characterCount={bookToEdit.characterCount}
        initialSeries={bookToEditSeries}
        existingSeries={existingSeries}
        onClose={() => setBookToEdit({ isOpen: false, bookTitle: '', characterCount: 0 })}
        onSave={handleSaveEditedBook}
        onRecordTagInteraction={handleRecordTagInteraction}
      />

      {/* Delete Book Modal */}
      <DeleteBookModal
        isOpen={bookToDelete.isOpen}
        bookTitle={bookToDelete.bookTitle}
        characterCount={bookToDelete.characterCount}
        onClose={() => setBookToDelete({ isOpen: false, bookTitle: '', characterCount: 0 })}
        onConfirmDelete={handleConfirmDeleteBook}
      />

      {/* Add / Edit Character Modal */}
      <CharacterModal
        isOpen={characterModal.isOpen}
        onClose={handleCloseModal}
        onSave={handleSaveCharacter}
        initialData={characterModal.initialData}
        defaultBook={characterModal.defaultBook}
        defaultSeries={characterModal.defaultSeries}
        existingBooks={existingBooks}
        existingSeries={existingSeries}
        bookSeriesMap={bookSeriesMap}
        allCharacters={characters}
        onRecordTagInteraction={handleRecordTagInteraction}
      />

      {/* Add Book & Assign Characters Modal */}
      <AddBookModal
        isOpen={isAddBookModalOpen}
        onClose={() => setIsAddBookModalOpen(false)}
        onSaveBook={handleSaveBook}
        existingBooks={existingBooks}
        existingSeries={existingSeries}
        allCharacters={characters}
        bookSeriesMap={bookSeriesMap}
        onRecordTagInteraction={handleRecordTagInteraction}
      />

      {/* Character Deep Dossier Modal */}
      <CharacterDetailModal
        character={detailCharacter}
        bookSeriesMap={bookSeriesMap}
        onClose={() => setDetailCharacter(null)}
        onEdit={handleOpenEditModal}
        onDelete={handleRequestDelete}
      />

      {/* Delete Character Confirmation Modal */}
      <DeleteConfirmationModal
        character={characterToDelete}
        isOpen={Boolean(characterToDelete)}
        onClose={() => setCharacterToDelete(null)}
        onConfirmDelete={handleConfirmDelete}
      />

      {/* CSV Export Modal */}
      <CsvExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        characters={characters}
        existingBooks={existingBooks}
        existingSeries={existingSeries}
        bookSeriesMap={bookSeriesMap}
      />

      {/* CSV Import Modal */}
      <CsvImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleBatchImport}
        existingCharacters={characters}
      />

      {/* Subtle Footer */}
      <footer className="mt-auto border-t border-[#DFD1BD] dark:border-[#382312] py-6 text-center text-xs text-[#826650] dark:text-[#A68F7B] font-sans-ui transition-colors">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#8C5E3B] dark:text-[#D49E6F]" />
            <span className="font-semibold text-[#54361F] dark:text-[#FAF6F0]">Character Arc</span>
            <span className="text-[#AFA192] dark:text-[#523C2B]">•</span>
            <span>Never lose the plot—or the people in it.</span>
          </div>
          {user && (
            <div className="flex items-center gap-3 text-[11px] text-[#7A614C] dark:text-[#A68F7B]">
              <span>Logged in as <strong>{user.email}</strong></span>
              <button
                onClick={handleSeedSamples}
                disabled={isSeeding}
                className="text-[#694223] dark:text-[#D49E6F] hover:underline cursor-pointer"
              >
                + Load Classic Literature Characters
              </button>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
