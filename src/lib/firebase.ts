import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  setDoc,
  getDoc,
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy,
  writeBatch
} from 'firebase/firestore';
import type { Character } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const signInWithGoogle = async (): Promise<User | null> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

export const signOutUser = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

export const subscribeToUserCharacters = (
  userId: string,
  onUpdate: (characters: Character[]) => void,
  onError?: (error: Error) => void
) => {
  const charactersRef = collection(db, 'users', userId, 'characters');
  const q = query(charactersRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const characters: Character[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        
        // Normalize books: support array and backwards-compatible single book string
        let booksList: string[] = [];
        if (Array.isArray(data.books)) {
          booksList = data.books.filter((b: any) => typeof b === 'string' && b.trim().length > 0);
        } else if (data.book && typeof data.book === 'string' && data.book.trim().length > 0) {
          booksList = [data.book.trim()];
        }

        // Normalize series: support array and backwards-compatible single series string
        let seriesList: string[] = [];
        if (Array.isArray(data.series)) {
          seriesList = data.series.filter((s: any) => typeof s === 'string' && s.trim().length > 0);
        } else if (data.series && typeof data.series === 'string' && data.series.trim().length > 0) {
          seriesList = [data.series.trim()];
        }

        return {
          id: docSnap.id,
          name: data.name || '',
          description: data.description || '',
          spoilers: typeof data.spoilers === 'string' ? data.spoilers : '',
          books: booksList,
          series: seriesList,
          book: booksList[0] || '',
          role: data.role || '',
          createdAt: data.createdAt || Date.now(),
          updatedAt: data.updatedAt || Date.now(),
        };
      });
      onUpdate(characters);
    },
    (err) => {
      console.error('Snapshot error for characters:', err);
      if (onError) onError(err);
    }
  );
};

export const addCharacterDoc = async (
  userId: string,
  charData: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  const charactersRef = collection(db, 'users', userId, 'characters');
  const now = Date.now();

  const cleanBooks = Array.from(
    new Set((charData.books || []).map((b) => b.trim()).filter((b) => b.length > 0))
  );

  const docRef = await addDoc(charactersRef, {
    name: charData.name.trim(),
    description: charData.description.trim(),
    spoilers: charData.spoilers ? charData.spoilers.trim() : '',
    books: cleanBooks,
    series: [], // Decoupled: series are now linked to books
    book: cleanBooks[0] || '', // legacy fallback
    role: charData.role?.trim() || '',
    createdAt: now,
    updatedAt: now,
  });

  if (cleanBooks.length > 0) {
    await registerBookTimestamps(userId, cleanBooks);
  }

  return docRef.id;
};

export const updateCharacterDoc = async (
  userId: string,
  characterId: string,
  charData: Partial<Omit<Character, 'id' | 'createdAt'>>
): Promise<void> => {
  const characterRef = doc(db, 'users', userId, 'characters', characterId);
  const cleanData: Record<string, any> = {
    updatedAt: Date.now(),
  };

  if (charData.name !== undefined) cleanData.name = charData.name.trim();
  if (charData.description !== undefined) cleanData.description = charData.description.trim();
  if (charData.spoilers !== undefined) cleanData.spoilers = charData.spoilers.trim();
  if (charData.books !== undefined) {
    cleanData.books = Array.from(
      new Set((charData.books || []).map((b) => b.trim()).filter((b) => b.length > 0))
    );
    cleanData.book = cleanData.books[0] || '';
  }
  if (charData.role !== undefined) cleanData.role = charData.role.trim();

  await updateDoc(characterRef, cleanData);

  if (cleanData.books && cleanData.books.length > 0) {
    await registerBookTimestamps(userId, cleanData.books);
  }
};

export const deleteCharacterDoc = async (
  userId: string,
  characterId: string
): Promise<void> => {
  try {
    const characterRef = doc(db, 'users', userId, 'characters', characterId);
    await deleteDoc(characterRef);
  } catch (error) {
    console.error('Error deleting character doc:', error);
    throw error;
  }
};

/**
 * Persists the user's book-to-series mapping in Firestore.
 */
export const saveBookSeriesMap = async (
  userId: string,
  bookSeries: Record<string, string[]>
): Promise<void> => {
  try {
    const docRef = doc(db, 'users', userId, 'preferences', 'bookSeries');
    await setDoc(docRef, {
      mapping: bookSeries,
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.error('Error saving book-series map:', error);
  }
};

/**
 * Subscribes to the user's book-to-series mapping in Firestore.
 */
export const subscribeToBookSeries = (
  userId: string,
  onUpdate: (bookSeries: Record<string, string[]>) => void
) => {
  const docRef = doc(db, 'users', userId, 'preferences', 'bookSeries');
  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data && typeof data.mapping === 'object' && data.mapping !== null) {
          onUpdate(data.mapping as Record<string, string[]>);
          return;
        }
      }
      onUpdate({});
    },
    (error) => {
      console.warn('Snapshot error for bookSeries (using local fallback):', error);
    }
  );
};

/**
 * Updates the series associated with a specific book in Firestore.
 */
export const updateBookSeriesInFirestore = async (
  userId: string,
  bookTitle: string,
  seriesList: string[],
  currentBookSeriesMap: Record<string, string[]>
): Promise<void> => {
  const cleanBook = bookTitle.trim();
  if (!cleanBook) return;

  const nextMap: Record<string, string[]> = { ...currentBookSeriesMap };
  const cleanSeries = Array.from(new Set(seriesList.map((s) => s.trim()).filter((s) => s.length > 0)));

  const previousSeries = currentBookSeriesMap[cleanBook] || [];

  if (cleanSeries.length > 0) {
    nextMap[cleanBook] = cleanSeries;
  } else {
    delete nextMap[cleanBook];
  }

  await saveBookSeriesMap(userId, nextMap);

  // If any series was removed from this book, check if it now has 0 books tagged.
  // If a series has no books tagged with it, ensure the Book Series is removed!
  const removedSeries = previousSeries.filter((ps) => !cleanSeries.includes(ps));
  for (const sName of removedSeries) {
    const hasOtherBooksInSeries = Object.entries(nextMap).some(
      ([b, sArr]) => b !== cleanBook && Array.isArray(sArr) && sArr.includes(sName)
    );

    if (!hasOtherBooksInSeries) {
      try {
        const seriesDocId = encodeURIComponent(sName);
        const seriesOrderRef = doc(db, 'users', userId, 'seriesOrders', seriesDocId);
        await deleteDoc(seriesOrderRef);
      } catch (err) {
        console.warn('Error deleting empty series order:', err);
      }
    } else {
      // Remove this book from the series order
      try {
        const seriesDocId = encodeURIComponent(sName);
        const seriesOrderRef = doc(db, 'users', userId, 'seriesOrders', seriesDocId);
        const snap = await getDoc(seriesOrderRef);
        if (snap.exists() && Array.isArray(snap.data().bookOrder)) {
          const updatedOrder = snap.data().bookOrder.filter((b: string) => b !== cleanBook);
          await setDoc(seriesOrderRef, {
            seriesName: sName,
            bookOrder: updatedOrder,
            updatedAt: Date.now(),
          });
        }
      } catch (err) {
        console.warn('Error updating series order for unassigned book:', err);
      }
    }
  }

  for (const sName of cleanSeries) {
    try {
      const seriesDocId = encodeURIComponent(sName);
      const seriesOrderRef = doc(db, 'users', userId, 'seriesOrders', seriesDocId);
      const snap = await getDoc(seriesOrderRef);
      let baseOrder: string[] = [];
      if (snap.exists() && Array.isArray(snap.data().bookOrder)) {
        baseOrder = [...snap.data().bookOrder];
      }
      if (!baseOrder.includes(cleanBook)) {
        baseOrder.push(cleanBook);
        await setDoc(seriesOrderRef, {
          seriesName: sName,
          bookOrder: baseOrder,
          updatedAt: Date.now(),
        });
      }
    } catch (e) {
      console.warn('Error updating series order for', sName, e);
    }
  }
};

/**
 * Creates or updates a book entry by assigning it to selected characters,
 * linking the book to its series, and creating any newly typed characters inline.
 * Automatically appends the new book to series order and records its timestamp.
 */
export const addBookToCharacters = async (
  userId: string,
  bookTitle: string,
  seriesName: string | string[] | undefined,
  characterIds: string[],
  allCharacters: Character[],
  newCharacters?: { name: string; role?: string; description?: string }[],
  currentSeriesOrder?: string[],
  currentBookSeriesMap: Record<string, string[]> = {}
): Promise<void> => {
  const batch = writeBatch(db);
  const now = Date.now();
  const parsedBooks = bookTitle
    .split(',')
    .map((b) => b.trim())
    .filter((b) => b.length > 0);

  if (parsedBooks.length === 0) return;

  const parsedSeries: string[] = Array.isArray(seriesName)
    ? seriesName.map((s) => s.trim()).filter((s) => s.length > 0)
    : (seriesName ? [seriesName.trim()].filter((s) => s.length > 0) : []);

  // 1. Update existing selected characters (books only, series unlinked from characters)
  characterIds.forEach((charId) => {
    const existing = allCharacters.find((c) => c.id === charId);
    if (!existing) return;

    const existingBooks = Array.isArray(existing.books) ? [...existing.books] : (existing.book ? [existing.book] : []);
    parsedBooks.forEach((bookItem) => {
      if (!existingBooks.includes(bookItem)) {
        existingBooks.push(bookItem);
      }
    });

    const charRef = doc(db, 'users', userId, 'characters', charId);
    batch.update(charRef, {
      books: existingBooks,
      book: existingBooks[0] || '',
      updatedAt: now,
    });
  });

  // 2. Add any new inline characters
  if (Array.isArray(newCharacters)) {
    newCharacters.forEach((newChar, idx) => {
      if (!newChar.name.trim()) return;
      const charRef = doc(collection(db, 'users', userId, 'characters'));
      batch.set(charRef, {
        name: newChar.name.trim(),
        description: (newChar.description || '').trim() || `Character in "${parsedBooks.join(', ')}"`,
        books: parsedBooks,
        book: parsedBooks[0] || '',
        series: [],
        role: (newChar.role || '').trim() || 'Character',
        createdAt: now + idx,
        updatedAt: now + idx,
      });
    });
  }

  await batch.commit();

  // 3. Register book timestamps so the newly added book is chronologically marked as newer
  await registerBookTimestamps(userId, parsedBooks);

  // 4. Link Books to Book Series
  if (parsedSeries.length > 0) {
    const nextMap: Record<string, string[]> = { ...currentBookSeriesMap };
    parsedBooks.forEach((pb) => {
      const existing = nextMap[pb] ? [...nextMap[pb]] : [];
      parsedSeries.forEach((ps) => {
        if (!existing.includes(ps)) existing.push(ps);
      });
      nextMap[pb] = existing;
    });
    await saveBookSeriesMap(userId, nextMap);
  }

  // 5. For each series provided, automatically append new books to the series ordering
  for (const sName of parsedSeries) {
    try {
      const seriesDocId = encodeURIComponent(sName);
      const seriesOrderRef = doc(db, 'users', userId, 'seriesOrders', seriesDocId);
      const snap = await getDoc(seriesOrderRef);

      let baseOrder: string[] = [];
      if (snap.exists() && Array.isArray(snap.data().bookOrder)) {
        baseOrder = [...snap.data().bookOrder];
      } else if (currentSeriesOrder && currentSeriesOrder.length > 0) {
        baseOrder = [...currentSeriesOrder];
      } else {
        // Collect existing books for this series from currentBookSeriesMap
        const existingInSeries = new Set<string>();
        Object.entries(currentBookSeriesMap).forEach(([b, sArr]) => {
          if (Array.isArray(sArr) && sArr.includes(sName)) {
            existingInSeries.add(b);
          }
        });
        baseOrder = Array.from(existingInSeries);
      }

      parsedBooks.forEach((pb) => {
        if (!baseOrder.includes(pb)) {
          baseOrder.push(pb);
        }
      });

      await setDoc(seriesOrderRef, {
        seriesName: sName,
        bookOrder: baseOrder,
        updatedAt: Date.now(),
      });
    } catch (err) {
      console.warn('Error auto-updating series order for ' + sName + ':', err);
    }
  }
};

/**
 * Renames a book across all characters in the user's journal that reference the old book title,
 * and updates the book-to-series mapping and series orders.
 */
export const renameBookInCharacters = async (
  userId: string,
  oldBookTitle: string,
  newBookTitle: string,
  allCharacters: Character[],
  currentBookSeriesMap: Record<string, string[]> = {}
): Promise<number> => {
  const cleanOld = oldBookTitle.trim();
  const cleanNew = newBookTitle.trim();
  if (!cleanOld || !cleanNew || cleanOld === cleanNew) return 0;

  // Update book-series mapping
  if (currentBookSeriesMap[cleanOld]) {
    const nextMap = { ...currentBookSeriesMap };
    nextMap[cleanNew] = nextMap[cleanOld];
    delete nextMap[cleanOld];
    await saveBookSeriesMap(userId, nextMap);
  }

  const matchingChars = allCharacters.filter((c) => {
    if (Array.isArray(c.books) && c.books.includes(cleanOld)) return true;
    if (c.book === cleanOld) return true;
    return false;
  });

  if (matchingChars.length === 0) return 0;

  const now = Date.now();
  const BATCH_SIZE = 400;

  for (let i = 0; i < matchingChars.length; i += BATCH_SIZE) {
    const chunk = matchingChars.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);

    chunk.forEach((c) => {
      const currentBooks = Array.isArray(c.books) ? [...c.books] : (c.book ? [c.book] : []);
      const updatedBooks: string[] = [];

      currentBooks.forEach((b) => {
        if (b === cleanOld) {
          if (!updatedBooks.includes(cleanNew)) {
            updatedBooks.push(cleanNew);
          }
        } else if (!updatedBooks.includes(b)) {
          updatedBooks.push(b);
        }
      });

      const charRef = doc(db, 'users', userId, 'characters', c.id);
      batch.update(charRef, {
        books: updatedBooks,
        book: updatedBooks[0] || '',
        updatedAt: now,
      });
    });

    await batch.commit();
  }

  return matchingChars.length;
};

/**
 * Deletes a book reference from all characters in the user's journal without deleting the characters themselves.
 */
export const deleteBookFromCharacters = async (
  userId: string,
  bookTitle: string,
  allCharacters: Character[],
  currentBookSeriesMap: Record<string, string[]> = {}
): Promise<number> => {
  const cleanBook = bookTitle.trim();
  if (!cleanBook) return 0;

  // Clean up bookSeriesMap and check for any orphaned series
  if (currentBookSeriesMap[cleanBook]) {
    const nextMap = { ...currentBookSeriesMap };
    const affectedSeries = nextMap[cleanBook] ? [...nextMap[cleanBook]] : [];
    delete nextMap[cleanBook];
    await saveBookSeriesMap(userId, nextMap);

    // If there are no books that have the tag for this series, ensure the Book Series is removed
    for (const sName of affectedSeries) {
      const hasOtherBooksInSeries = Object.values(nextMap).some(
        (sArr) => Array.isArray(sArr) && sArr.includes(sName)
      );
      if (!hasOtherBooksInSeries) {
        try {
          const seriesDocId = encodeURIComponent(sName);
          const seriesOrderRef = doc(db, 'users', userId, 'seriesOrders', seriesDocId);
          await deleteDoc(seriesOrderRef);
        } catch (err) {
          console.warn('Error deleting empty series order:', err);
        }
      }
    }
  }

  const matchingChars = allCharacters.filter((c) => {
    if (Array.isArray(c.books) && c.books.includes(cleanBook)) return true;
    if (c.book === cleanBook) return true;
    return false;
  });

  if (matchingChars.length === 0) return 0;

  const now = Date.now();
  const BATCH_SIZE = 400;

  for (let i = 0; i < matchingChars.length; i += BATCH_SIZE) {
    const chunk = matchingChars.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);

    chunk.forEach((c) => {
      const currentBooks = Array.isArray(c.books) ? [...c.books] : (c.book ? [c.book] : []);
      const updatedBooks = currentBooks.filter((b) => b !== cleanBook);

      const charRef = doc(db, 'users', userId, 'characters', c.id);
      batch.update(charRef, {
        books: updatedBooks,
        book: updatedBooks[0] || '',
        updatedAt: now,
      });
    });

    await batch.commit();
  }

  return matchingChars.length;
};

/**
 * Persists custom book ordering for a specific series in Firestore.
 */
export const saveSeriesBookOrder = async (
  userId: string,
  seriesName: string,
  bookOrder: string[]
): Promise<void> => {
  try {
    const seriesDocId = encodeURIComponent(seriesName.trim());
    const docRef = doc(db, 'users', userId, 'seriesOrders', seriesDocId);
    await setDoc(docRef, {
      seriesName: seriesName.trim(),
      bookOrder,
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.error('Error saving series book order to Firestore:', error);
  }
};

/**
 * Deletes a series book order document from Firestore when the series no longer has any books.
 */
export const deleteSeriesOrderFromFirestore = async (
  userId: string,
  seriesName: string
): Promise<void> => {
  try {
    const seriesDocId = encodeURIComponent(seriesName.trim());
    const docRef = doc(db, 'users', userId, 'seriesOrders', seriesDocId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting series book order from Firestore:', error);
  }
};

/**
 * Subscribes to custom series book ordering preferences in Firestore.
 */
export const subscribeToSeriesOrders = (
  userId: string,
  onUpdate: (orders: Record<string, string[]>) => void
) => {
  const seriesOrdersRef = collection(db, 'users', userId, 'seriesOrders');
  return onSnapshot(
    seriesOrdersRef,
    (snapshot) => {
      const orders: Record<string, string[]> = {};
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.seriesName && Array.isArray(data.bookOrder)) {
          orders[data.seriesName] = data.bookOrder;
        }
      });
      onUpdate(orders);
    },
    (error) => {
      console.warn('Snapshot error for series orders (using local fallback):', error);
    }
  );
};

/**
 * Persists the user's list of books marked as "Reading Now" in Firestore.
 */
export const saveReadingList = async (
  userId: string,
  books: string[]
): Promise<void> => {
  try {
    const docRef = doc(db, 'users', userId, 'preferences', 'readingList');
    await setDoc(docRef, {
      books,
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.error('Error saving reading list to Firestore:', error);
  }
};

/**
 * Subscribes to the user's "Reading Now" list in Firestore.
 */
export const subscribeToReadingList = (
  userId: string,
  onUpdate: (readingList: string[]) => void
) => {
  const docRef = doc(db, 'users', userId, 'preferences', 'readingList');
  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (Array.isArray(data.books)) {
          onUpdate(data.books);
          return;
        }
      }
      onUpdate([]);
    },
    (error) => {
      console.warn('Snapshot error for reading list (using local fallback):', error);
    }
  );
};

/**
 * Saves or registers addition timestamps for books in Firestore.
 */
export const registerBookTimestamps = async (
  userId: string,
  bookTitles: string[]
): Promise<void> => {
  try {
    const docRef = doc(db, 'users', userId, 'preferences', 'bookTimestamps');
    const existingSnap = await getDoc(docRef);
    const existingData = existingSnap.exists() ? existingSnap.data() : {};
    const timestamps = (existingData.timestamps as Record<string, number>) || {};

    let changed = false;
    const now = Date.now();
    bookTitles.forEach((title, idx) => {
      const trimmed = title.trim();
      if (trimmed && !timestamps[trimmed]) {
        timestamps[trimmed] = now + idx;
        changed = true;
      }
    });

    if (changed) {
      await setDoc(docRef, { timestamps, updatedAt: now }, { merge: true });
    }
  } catch (error) {
    console.error('Error registering book timestamps:', error);
  }
};

/**
 * Subscribes to registered book timestamps in Firestore.
 */
export const subscribeToBookTimestamps = (
  userId: string,
  onUpdate: (timestamps: Record<string, number>) => void
) => {
  const docRef = doc(db, 'users', userId, 'preferences', 'bookTimestamps');
  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data && typeof data.timestamps === 'object') {
          onUpdate(data.timestamps as Record<string, number>);
          return;
        }
      }
      onUpdate({});
    },
    (error) => {
      console.warn('Snapshot error for book timestamps:', error);
    }
  );
};

export interface TagInteractions {
  books: Record<string, number>;
  series: Record<string, number>;
}

/**
 * Saves user tag clicks and additions to Firestore preferences to ensure Most Recently Used
 * tag ordering is synced across sessions and devices.
 */
export const saveTagInteractions = async (
  userId: string,
  interactions: TagInteractions
): Promise<void> => {
  try {
    const docRef = doc(db, 'users', userId, 'preferences', 'tagInteractions');
    await setDoc(docRef, {
      books: interactions.books || {},
      series: interactions.series || {},
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.error('Error saving tag interactions to Firestore:', error);
  }
};

/**
 * Subscribes to user tag clicks and additions in Firestore.
 */
export const subscribeToTagInteractions = (
  userId: string,
  onUpdate: (interactions: TagInteractions) => void
) => {
  const docRef = doc(db, 'users', userId, 'preferences', 'tagInteractions');
  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data) {
          onUpdate({
            books: (data.books && typeof data.books === 'object') ? data.books : {},
            series: (data.series && typeof data.series === 'object') ? data.series : {},
          });
          return;
        }
      }
      onUpdate({ books: {}, series: {} });
    },
    (error) => {
      console.warn('Snapshot error for tag interactions (using local fallback):', error);
    }
  );
};

export const seedSampleClassicCharacters = async (userId: string): Promise<void> => {
  const sampleData: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
      name: "Elizabeth Bennet",
      description: "The second of the five Bennet daughters, Elizabeth is intelligent, quick-witted, sharp-tongued, and perceptive, though prone to making hasty initial judgments of others.",
      spoilers: "After overcoming mutual pride and prejudice, Elizabeth rejects Mr. Collins and initially rejects Darcy, but later realizes her deep love for Darcy after discovering his secret benevolence in rescuing Lydia from disgrace.",
      books: ["Pride and Prejudice"],
      series: [],
      role: "Protagonist"
    },
    {
      name: "Fitzwilliam Darcy",
      description: "A wealthy, aristocratic gentleman and master of Pemberley estate. Initially haughty and reserved in social gatherings, he possesses deep integrity and generosity.",
      spoilers: "Secretly tracks down Wickham and Lydia in London, pays off all of Wickham's enormous debts, and buys his military commission to secure the marriage and save the Bennet family from total social ruin.",
      books: ["Pride and Prejudice"],
      series: [],
      role: "Protagonist"
    },
    {
      name: "Gandalf the Grey",
      description: "An Istari wizard of great wisdom and power, member of the White Council, bearer of the Ring of Fire (Narya), guide of the Fellowship of the Ring and counselor to kings.",
      spoilers: "Falls in Moria fighting the Balrog of Morgoth, dies on the peak of Zirakzigil, and is sent back by Eru Ilúvatar as Gandalf the White to lead the Free Peoples to victory.",
      books: ["The Hobbit", "The Fellowship of the Ring", "The Two Towers", "The Return of the King"],
      series: ["The Lord of the Rings", "Middle-earth Legendarium"],
      role: "Mentor"
    },
    {
      name: "Frodo Baggins",
      description: "A Hobbit of the Shire who inherits the One Ring from Bilbo and undertakes the perilous quest to Mount Doom to destroy it in the fires where it was forged.",
      spoilers: "Ultimately claims the Ring for himself at the Crack of Doom, but Gollum bites off his finger with the Ring and falls into the lava, inadvertently destroying it. Frodo eventually sails to the Undying Lands to heal.",
      books: ["The Fellowship of the Ring", "The Two Towers", "The Return of the King"],
      series: ["The Lord of the Rings"],
      role: "Protagonist"
    },
    {
      name: "Aragorn",
      description: "Son of Arathorn, chieftain of the Dúnedain of the North, true heir to the thrones of Arnor and Gondor, also known by the Ranger moniker Strider and crowned King Elessar.",
      spoilers: "Claims the reforged sword Andúril, summons the Army of the Dead to break the siege of Minas Tirith, and is crowned King Elessar of the Reunited Kingdom before marrying Arwen Undómiel.",
      books: ["The Fellowship of the Ring", "The Two Towers", "The Return of the King"],
      series: ["The Lord of the Rings"],
      role: "Protagonist"
    },
    {
      name: "Paul Atreides",
      description: "Son of Duke Leto and Lady Jessica, trained in Bene Gesserit ways and Mentat computation. Prophesied Kwisatz Haderach and the desert messiah known to the Fremen as Muad'Dib.",
      spoilers: "Survives the Harkonnen coup, drinks the Water of Life, leads the Fremen jihad to overthrow Emperor Shaddam IV, takes the Golden Lion Throne, but is eventually blinded and walks into the deep desert as a preacher.",
      books: ["Dune", "Dune Messiah", "Children of Dune"],
      series: ["Dune Chronicles"],
      role: "Protagonist"
    },
    {
      name: "Lady Jessica",
      description: "A Bene Gesserit adept and bound concubine of Duke Leto Atreides. Mother of Paul and Alia, possessing exceptional Prana-bindu bodily control and Voice mastery.",
      books: ["Dune", "Children of Dune"],
      series: ["Dune Chronicles"],
      role: "Protagonist"
    },
    {
      name: "Sherlock Holmes",
      description: "The world's foremost consulting detective based at 221B Baker Street. Renowned for his razor-sharp observational deduction, forensic science, and violin playing.",
      books: ["A Study in Scarlet", "The Sign of the Four", "The Hound of the Baskervilles", "The Valley of Fear"],
      series: ["Sherlock Holmes Mysteries"],
      role: "Protagonist"
    },
    {
      name: "Dr. John H. Watson",
      description: "Former army surgeon wounded in Afghanistan, trusted companion and chronicler of Sherlock Holmes's investigative cases.",
      books: ["A Study in Scarlet", "The Sign of the Four", "The Hound of the Baskervilles", "The Valley of Fear"],
      series: ["Sherlock Holmes Mysteries"],
      role: "Supporting"
    },
    {
      name: "Roland Deschain",
      description: "The last surviving Gunslinger of Gilead, line of Eld. Driven on an obsessive, centuries-long pilgrimage across a decaying world toward the Dark Tower.",
      books: ["The Gunslinger", "The Drawing of the Three", "The Waste Lands", "Wizard and Glass", "Wolves of the Calla", "Song of Susannah", "The Dark Tower"],
      series: ["The Dark Tower"],
      role: "Protagonist"
    },
    {
      name: "Atticus Finch",
      description: "A principled, compassionate defense attorney in Maycomb, Alabama, and devoted father to Scout and Jem, known for his calm moral courage.",
      books: ["To Kill a Mockingbird", "Go Set a Watchman"],
      series: [],
      role: "Protagonist"
    },
    {
      name: "Scout Finch",
      description: "Jean Louise Finch, an inquisitive, outspoken tomboy growing up in 1930s Alabama whose narrative perspective frames the events of Maycomb.",
      books: ["To Kill a Mockingbird", "Go Set a Watchman"],
      series: [],
      role: "Protagonist"
    }
  ];

  const batch = writeBatch(db);
  const charactersRef = collection(db, 'users', userId, 'characters');
  const now = Date.now();

  for (let i = 0; i < sampleData.length; i++) {
    const item = sampleData[i];
    const newDocRef = doc(charactersRef);
    batch.set(newDocRef, {
      ...item,
      book: item.books[0] || '',
      createdAt: now - (sampleData.length - i) * 1000,
      updatedAt: now - (sampleData.length - i) * 1000,
    });
  }

  await batch.commit();

  // Also seed canonical series order for Lord of the Rings, book timestamps, and book-to-series mapping
  const sampleBookSeries: Record<string, string[]> = {
    'The Hobbit': ['The Lord of the Rings', 'Middle-earth Legendarium'],
    'The Fellowship of the Ring': ['The Lord of the Rings', 'Middle-earth Legendarium'],
    'The Two Towers': ['The Lord of the Rings', 'Middle-earth Legendarium'],
    'The Return of the King': ['The Lord of the Rings', 'Middle-earth Legendarium'],
    'Dune': ['Dune Chronicles'],
    'Dune Messiah': ['Dune Chronicles'],
    'Children of Dune': ['Dune Chronicles'],
    'A Study in Scarlet': ['Sherlock Holmes Mysteries'],
    'The Sign of the Four': ['Sherlock Holmes Mysteries'],
    'The Hound of the Baskervilles': ['Sherlock Holmes Mysteries'],
    'The Valley of Fear': ['Sherlock Holmes Mysteries'],
    'The Gunslinger': ['The Dark Tower'],
    'The Drawing of the Three': ['The Dark Tower'],
    'The Waste Lands': ['The Dark Tower'],
    'Wizard and Glass': ['The Dark Tower'],
    'Wolves of the Calla': ['The Dark Tower'],
    'Song of Susannah': ['The Dark Tower'],
    'The Dark Tower': ['The Dark Tower'],
  };
  await saveBookSeriesMap(userId, sampleBookSeries);

  await saveSeriesBookOrder(userId, 'The Lord of the Rings', [
    'The Hobbit',
    'The Fellowship of the Ring',
    'The Two Towers',
    'The Return of the King',
  ]);
  await saveSeriesBookOrder(userId, 'Middle-earth Legendarium', [
    'The Hobbit',
    'The Fellowship of the Ring',
    'The Two Towers',
    'The Return of the King',
  ]);

  const allSeedBooks: string[] = [];
  sampleData.forEach((sd) => {
    sd.books.forEach((b) => {
      if (!allSeedBooks.includes(b)) allSeedBooks.push(b);
    });
  });
  await registerBookTimestamps(userId, allSeedBooks);
};

export interface CsvImportRecord {
  name: string;
  role?: string;
  books: string[];
  series: string[];
  description: string;
  spoilers?: string;
}

export type ImportResolutionMode = 'add_new_only' | 'overwrite_existing';

export const batchImportCharacters = async (
  userId: string,
  rows: CsvImportRecord[],
  existingCharacters: Character[],
  mode: ImportResolutionMode
): Promise<{ added: number; updated: number; skipped: number }> => {
  const charactersRef = collection(db, 'users', userId, 'characters');
  const now = Date.now();
  let added = 0;
  let updated = 0;
  let skipped = 0;

  // Build a lookup map of existing characters by lowercase trimmed name
  const existingMap = new Map<string, Character>();
  existingCharacters.forEach((c) => {
    existingMap.set(c.name.trim().toLowerCase(), c);
  });

  const operations: Array<{
    type: 'set' | 'update';
    ref: any;
    data: any;
  }> = [];

  rows.forEach((row, idx) => {
    const cleanName = row.name.trim();
    if (!cleanName) return;

    const lowerName = cleanName.toLowerCase();
    const existing = existingMap.get(lowerName);

    const cleanBooks = Array.from(
      new Set((row.books || []).map((b) => b.trim()).filter((b) => b.length > 0))
    );
    const cleanSeries = Array.from(
      new Set((row.series || []).map((s) => s.trim()).filter((s) => s.length > 0))
    );
    const cleanDesc = row.description ? row.description.trim() : '';
    const cleanSpoilers = row.spoilers ? row.spoilers.trim() : '';
    const cleanRole = row.role ? row.role.trim() : '';

    if (existing) {
      if (mode === 'add_new_only') {
        skipped++;
        return;
      } else {
        // Overwrite mode: update the existing doc
        const charRef = doc(db, 'users', userId, 'characters', existing.id);
        const mergedBooks = cleanBooks.length > 0 ? cleanBooks : existing.books;
        const mergedSeries = cleanSeries.length > 0 ? cleanSeries : existing.series;

        operations.push({
          type: 'update',
          ref: charRef,
          data: {
            name: cleanName,
            role: cleanRole || existing.role || '',
            description: cleanDesc || existing.description || '',
            spoilers: cleanSpoilers,
            books: mergedBooks,
            series: mergedSeries,
            book: mergedBooks[0] || existing.book || '',
            updatedAt: now + idx,
          },
        });
        updated++;
      }
    } else {
      // Add new record
      const charRef = doc(charactersRef);
      operations.push({
        type: 'set',
        ref: charRef,
        data: {
          name: cleanName,
          role: cleanRole || 'Character',
          description: cleanDesc || `Character in ${cleanBooks.join(', ') || 'library'}`,
          spoilers: cleanSpoilers,
          books: cleanBooks,
          series: cleanSeries,
          book: cleanBooks[0] || '',
          createdAt: now + idx,
          updatedAt: now + idx,
        },
      });
      // Register in existing map to handle multiple identical names in same CSV
      existingMap.set(lowerName, {
        id: charRef.id,
        name: cleanName,
        role: cleanRole,
        description: cleanDesc,
        spoilers: cleanSpoilers,
        books: cleanBooks,
        series: cleanSeries,
        createdAt: now + idx,
        updatedAt: now + idx,
      });
      added++;
    }
  });

  // Execute in batches of 400
  const BATCH_SIZE = 400;
  for (let i = 0; i < operations.length; i += BATCH_SIZE) {
    const chunk = operations.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);
    chunk.forEach((op) => {
      if (op.type === 'set') {
        batch.set(op.ref, op.data);
      } else {
        batch.update(op.ref, op.data);
      }
    });
    await batch.commit();
  }

  return { added, updated, skipped };
};
