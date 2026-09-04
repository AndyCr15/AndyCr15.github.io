import type { Character, BookGroup, SeriesGroup } from '../types';

/**
 * Normalizes a title for alphabetical sorting by stripping leading English articles ('a', 'an', 'the').
 * e.g. "The Great Gatsby" -> "Great Gatsby", "A Game of Thrones" -> "Game of Thrones", "An Ember in the Ashes" -> "Ember in the Ashes"
 */
export function normalizeForAlphabeticalSort(title: string): string {
  if (!title) return '';
  const trimmed = title.trim();
  const articleRegex = /^(the|a|an)\s+/i;
  const stripped = trimmed.replace(articleRegex, '').trim();
  return stripped || trimmed;
}

/**
 * Compares two titles alphabetically while ignoring leading articles.
 */
export function compareTitlesIgnoringArticles(a: string, b: string): number {
  const normA = normalizeForAlphabeticalSort(a);
  const normB = normalizeForAlphabeticalSort(b);
  const cmp = normA.localeCompare(normB, undefined, { sensitivity: 'base' });
  if (cmp !== 0) return cmp;
  return a.localeCompare(b, undefined, { sensitivity: 'base' });
}

/**
 * Derives what Book Series a Character has been in by seeing what Books they are in
 * and what Series those books are in.
 */
export function getCharacterSeries(
  character: Character,
  bookSeriesMap: Record<string, string[]> = {}
): string[] {
  const books = Array.isArray(character.books) && character.books.length > 0
    ? character.books
    : (character.book ? [character.book] : []);
  
  const seriesSet = new Set<string>();
  
  books.forEach((b) => {
    const cleanBook = b.trim();
    if (!cleanBook) return;
    const mapped = bookSeriesMap[cleanBook];
    if (Array.isArray(mapped)) {
      mapped.forEach((s) => {
        if (s && s.trim()) seriesSet.add(s.trim());
      });
    }
  });

  // Fallback to legacy series if none found in map (backwards compatibility)
  if (seriesSet.size === 0 && Array.isArray(character.series)) {
    character.series.forEach((s) => {
      if (s && s.trim()) seriesSet.add(s.trim());
    });
  }

  return Array.from(seriesSet).sort(compareTitlesIgnoringArticles);
}

export function filterCharacters(
  characters: Character[], 
  query: string,
  titlesOnly: boolean = false,
  bookSeriesMap: Record<string, string[]> = {}
): Character[] {
  if (!query.trim()) return characters;
  const q = query.toLowerCase().trim();

  return characters.filter((c) => {
    // When "Titles Only" is ON, the main title for a character is the Character Name!
    if (titlesOnly) {
      return c.name.toLowerCase().includes(q);
    }

    // When "Titles Only" is OFF, perform full content search:
    const nameMatch = c.name.toLowerCase().includes(q);
    const booksMatch = Array.isArray(c.books) && c.books.some((b) => b.toLowerCase().includes(q));
    const charSeries = getCharacterSeries(c, bookSeriesMap);
    const seriesMatch = charSeries.some((s) => s.toLowerCase().includes(q));
    const legacyBookMatch = c.book ? c.book.toLowerCase().includes(q) : false;
    const descMatch = c.description ? c.description.toLowerCase().includes(q) : false;
    const spoilersMatch = c.spoilers ? c.spoilers.toLowerCase().includes(q) : false;
    const roleMatch = c.role ? c.role.toLowerCase().includes(q) : false;

    return nameMatch || booksMatch || seriesMatch || legacyBookMatch || descMatch || spoilersMatch || roleMatch;
  });
}

export function sortCharactersAlphabetically(characters: Character[]): Character[] {
  return [...characters].sort((a, b) => 
    a.name.trim().localeCompare(b.name.trim(), undefined, { sensitivity: 'base' })
  );
}

export function groupCharactersByLetter(characters: Character[]): Record<string, Character[]> {
  const sorted = sortCharactersAlphabetically(characters);
  const groups: Record<string, Character[]> = {};

  sorted.forEach((char) => {
    const firstChar = char.name.trim().charAt(0).toUpperCase();
    const letter = /[A-Z]/.test(firstChar) ? firstChar : '#';
    if (!groups[letter]) {
      groups[letter] = [];
    }
    groups[letter].push(char);
  });

  return groups;
}

export function groupCharactersByBook(
  characters: Character[],
  bookSeriesMap: Record<string, string[]> = {}
): BookGroup[] {
  // Map of bookTitle -> { seriesSet: Set<string>; charactersMap: Map<string, Character> }
  const map = new Map<string, { seriesSet: Set<string>; charactersMap: Map<string, Character> }>();

  characters.forEach((char) => {
    const charBooks = Array.isArray(char.books) && char.books.length > 0
      ? char.books
      : (char.book ? [char.book] : ['Unspecified Book']);

    charBooks.forEach((rawBook) => {
      const bookKey = rawBook.trim() || 'Unspecified Book';
      if (!map.has(bookKey)) {
        map.set(bookKey, { seriesSet: new Set(), charactersMap: new Map() });
      }
      const entry = map.get(bookKey)!;

      // Add series linked to this book from bookSeriesMap
      const mappedSeries = bookSeriesMap[bookKey];
      if (Array.isArray(mappedSeries)) {
        mappedSeries.forEach((s) => {
          if (s && s.trim()) entry.seriesSet.add(s.trim());
        });
      }

      // Add character's legacy series to this book if available and no series in map
      if (entry.seriesSet.size === 0 && Array.isArray(char.series)) {
        char.series.forEach((s) => {
          if (s.trim()) entry.seriesSet.add(s.trim());
        });
      }

      // Avoid duplicate character entries in same book
      entry.charactersMap.set(char.id, char);
    });
  });

  // Also include any books that exist in bookSeriesMap even if not yet populated with characters
  Object.keys(bookSeriesMap).forEach((rawBook) => {
    const bookKey = rawBook.trim();
    if (bookKey && !map.has(bookKey)) {
      const sSet = new Set<string>();
      bookSeriesMap[rawBook].forEach((s) => {
        if (s && s.trim()) sSet.add(s.trim());
      });
      map.set(bookKey, { seriesSet: sSet, charactersMap: new Map() });
    }
  });

  const bookGroups: BookGroup[] = [];
  map.forEach((value, bookTitle) => {
    bookGroups.push({
      bookTitle,
      series: Array.from(value.seriesSet).sort((a, b) => compareTitlesIgnoringArticles(a, b)),
      characters: sortCharactersAlphabetically(Array.from(value.charactersMap.values())),
    });
  });

  return bookGroups.sort((a, b) => {
    // Put "Unspecified Book" at the end
    if (a.bookTitle === 'Unspecified Book') return 1;
    if (b.bookTitle === 'Unspecified Book') return -1;
    return compareTitlesIgnoringArticles(a.bookTitle, b.bookTitle);
  });
}

/**
 * Filters book groups based on search query.
 * When titlesOnly is true: ONLY returns books that contain the search term in their main book title.
 * When titlesOnly is false: Returns books whose title matches OR books containing characters matching the query.
 */
export function filterBookGroups(
  characters: Character[],
  query: string,
  titlesOnly: boolean = false,
  bookSeriesMap: Record<string, string[]> = {}
): BookGroup[] {
  const allGroups = groupCharactersByBook(characters, bookSeriesMap);
  if (!query.trim()) return allGroups;

  const q = query.toLowerCase().trim();

  if (titlesOnly) {
    // Strictly filter by the book's main title
    return allGroups.filter((g) => g.bookTitle.toLowerCase().includes(q));
  }

  // Content search: Include books where book title or series matches, or matching characters exist inside
  return allGroups
    .map((g) => {
      const bookTitleMatches = g.bookTitle.toLowerCase().includes(q);
      const seriesMatches = g.series.some((s) => s.toLowerCase().includes(q));

      if (bookTitleMatches || seriesMatches) {
        return g;
      }

      const matchingChars = filterCharacters(g.characters, query, false, bookSeriesMap);
      if (matchingChars.length > 0) {
        return {
          ...g,
          characters: matchingChars,
        };
      }
      return null;
    })
    .filter((g): g is BookGroup => g !== null);
}

/**
 * Groups characters into book series chronicles.
 * Relational model:
 * Books are linked to Book Series. Characters are in a series if they are in a book that belongs to that series.
 * To see what Characters are in a series, check what books are in the series and then what characters are in those books.
 */
export function groupCharactersBySeries(
  characters: Character[],
  seriesOrders?: Record<string, string[]>,
  bookTimestamps?: Record<string, number>,
  bookSeriesMap: Record<string, string[]> = {}
): SeriesGroup[] {
  // 1. Index all characters by book
  const bookToCharsMap = new Map<string, Map<string, Character>>();
  const bookArrivalMap = new Map<string, { earliestAdded: number; arrivalOrder: number; minBookIndex: number }>();
  let arrivalCounter = 0;

  // Standalone characters without any book
  const unassignedBookChars = new Map<string, Character>();

  // Sort characters chronologically so arrival order follows actual character creation stream
  const sortedCharacters = [...characters].sort((a, b) => {
    const timeA = a.createdAt || a.updatedAt || 0;
    const timeB = b.createdAt || b.updatedAt || 0;
    return timeA - timeB;
  });

  sortedCharacters.forEach((char) => {
    const charBooks = Array.isArray(char.books) && char.books.length > 0
      ? char.books
      : (char.book ? [char.book] : []);

    const charCreated = char.createdAt || char.updatedAt || 0;

    if (charBooks.length === 0) {
      unassignedBookChars.set(char.id, char);
    } else {
      charBooks.forEach((rawBook, bIndex) => {
        const bookKey = rawBook.trim();
        if (!bookKey) return;

        if (!bookToCharsMap.has(bookKey)) {
          arrivalCounter++;
          bookToCharsMap.set(bookKey, new Map());

          const registeredTime = bookTimestamps && bookTimestamps[bookKey] ? bookTimestamps[bookKey] : 0;
          const effectiveTime = registeredTime > 0 ? registeredTime : (charCreated > 0 ? charCreated : Infinity);

          bookArrivalMap.set(bookKey, {
            earliestAdded: effectiveTime,
            arrivalOrder: arrivalCounter,
            minBookIndex: bIndex,
          });
        }

        bookToCharsMap.get(bookKey)!.set(char.id, char);

        const currentArrival = bookArrivalMap.get(bookKey)!;
        if (charCreated > 0 && charCreated < currentArrival.earliestAdded) {
          currentArrival.earliestAdded = charCreated;
        }
        if (bIndex < currentArrival.minBookIndex) {
          currentArrival.minBookIndex = bIndex;
        }
      });
    }
  });

  // Also record any books from bookSeriesMap that might not have characters yet
  Object.keys(bookSeriesMap).forEach((rawBook) => {
    const bookKey = rawBook.trim();
    if (bookKey && !bookToCharsMap.has(bookKey)) {
      arrivalCounter++;
      bookToCharsMap.set(bookKey, new Map());
      const registeredTime = bookTimestamps && bookTimestamps[bookKey] ? bookTimestamps[bookKey] : 0;
      bookArrivalMap.set(bookKey, {
        earliestAdded: registeredTime > 0 ? registeredTime : 0,
        arrivalOrder: arrivalCounter,
        minBookIndex: 0,
      });
    }
  });

  // 2. Map Series -> Set of Books
  const seriesToBooksMap = new Map<string, Set<string>>();

  // From bookSeriesMap (Books are linked to Series)
  Object.entries(bookSeriesMap).forEach(([bookTitle, seriesList]) => {
    const cleanBook = bookTitle.trim();
    if (!cleanBook) return;
    if (Array.isArray(seriesList)) {
      seriesList.forEach((s) => {
        const seriesName = s.trim();
        if (!seriesName) return;
        if (!seriesToBooksMap.has(seriesName)) {
          seriesToBooksMap.set(seriesName, new Set());
        }
        seriesToBooksMap.get(seriesName)!.add(cleanBook);
      });
    }
  });

  // Backwards compatibility: If existing characters still have legacy char.series, link those books
  characters.forEach((char) => {
    if (Array.isArray(char.series) && char.series.length > 0) {
      const charBooks = Array.isArray(char.books) && char.books.length > 0
        ? char.books
        : (char.book ? [char.book] : []);

      char.series.forEach((s) => {
        const seriesName = s.trim();
        if (!seriesName) return;
        if (!seriesToBooksMap.has(seriesName)) {
          seriesToBooksMap.set(seriesName, new Set());
        }
        charBooks.forEach((b) => {
          if (b && b.trim()) {
            seriesToBooksMap.get(seriesName)!.add(b.trim());
          }
        });
      });
    }
  });

  // Books that do not belong to any series
  const allKnownBooks = new Set<string>(Array.from(bookToCharsMap.keys()));
  const booksInAnySeries = new Set<string>();
  seriesToBooksMap.forEach((booksSet) => {
    booksSet.forEach((b) => booksInAnySeries.add(b));
  });

  const standaloneBooks = Array.from(allKnownBooks).filter((b) => !booksInAnySeries.has(b));

  // 3. Construct SeriesGroups
  const seriesGroups: SeriesGroup[] = [];

  seriesToBooksMap.forEach((booksSet, seriesName) => {
    // If there are no books that have the tag for this Book Series, ensure the Book Series is removed!
    if (booksSet.size === 0) {
      return;
    }

    const booksList: {
      bookTitle: string;
      characters: Character[];
      earliestAdded: number;
      arrivalOrder: number;
      minBookIndex: number;
    }[] = [];

    const countedCharIds = new Set<string>();
    const allSeriesCharactersMap = new Map<string, Character>();

    booksSet.forEach((bookTitle) => {
      const charsMap = bookToCharsMap.get(bookTitle) || new Map<string, Character>();
      const chars = sortCharactersAlphabetically(Array.from(charsMap.values()));
      chars.forEach((c) => {
        countedCharIds.add(c.id);
        allSeriesCharactersMap.set(c.id, c);
      });

      const arrival = bookArrivalMap.get(bookTitle) || {
        earliestAdded: 0,
        arrivalOrder: 0,
        minBookIndex: 0,
      };

      booksList.push({
        bookTitle,
        characters: chars,
        earliestAdded: arrival.earliestAdded === Infinity ? 0 : arrival.earliestAdded,
        arrivalOrder: arrival.arrivalOrder,
        minBookIndex: arrival.minBookIndex,
      });
    });

    // If after processing no books actually exist for this series, ensure the Book Series is removed!
    if (booksList.length === 0) {
      return;
    }

    // Sort books: respect custom series order if specified, else oldest added timestamp / arrival first
    if (seriesOrders && Array.isArray(seriesOrders[seriesName]) && seriesOrders[seriesName].length > 0) {
      const customOrder = seriesOrders[seriesName];
      booksList.sort((a, b) => {
        const idxA = customOrder.indexOf(a.bookTitle);
        const idxB = customOrder.indexOf(b.bookTitle);
        if (idxA !== -1 && idxB !== -1) {
          return idxA - idxB;
        }
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        if (a.earliestAdded && b.earliestAdded && a.earliestAdded !== b.earliestAdded) {
          return a.earliestAdded - b.earliestAdded;
        }
        if (a.arrivalOrder !== b.arrivalOrder) {
          return a.arrivalOrder - b.arrivalOrder;
        }
        return compareTitlesIgnoringArticles(a.bookTitle, b.bookTitle);
      });
    } else {
      // Default: Oldest added at top, newest at bottom
      booksList.sort((a, b) => {
        if (a.earliestAdded && b.earliestAdded && a.earliestAdded !== b.earliestAdded) {
          return a.earliestAdded - b.earliestAdded;
        }
        if (a.arrivalOrder !== b.arrivalOrder) {
          return a.arrivalOrder - b.arrivalOrder;
        }
        if (a.minBookIndex !== b.minBookIndex) {
          return a.minBookIndex - b.minBookIndex;
        }
        return compareTitlesIgnoringArticles(a.bookTitle, b.bookTitle);
      });
    }

    const allCharacters = sortCharactersAlphabetically(Array.from(allSeriesCharactersMap.values()));

    seriesGroups.push({
      seriesName,
      books: booksList.map(({ bookTitle, characters }) => ({ bookTitle, characters })),
      standaloneCharacters: [],
      allCharacters,
      totalCharacters: countedCharIds.size || allCharacters.length,
    });
  });

  // 4. Standalone / No Series (Books or characters not in any series)
  if (standaloneBooks.length > 0 || unassignedBookChars.size > 0) {
    const standaloneBooksList: {
      bookTitle: string;
      characters: Character[];
    }[] = [];

    const standaloneAllCharsMap = new Map<string, Character>();

    standaloneBooks.forEach((bookTitle) => {
      const charsMap = bookToCharsMap.get(bookTitle) || new Map<string, Character>();
      const chars = sortCharactersAlphabetically(Array.from(charsMap.values()));
      chars.forEach((c) => standaloneAllCharsMap.set(c.id, c));
      standaloneBooksList.push({
        bookTitle,
        characters: chars,
      });
    });

    standaloneBooksList.sort((a, b) => compareTitlesIgnoringArticles(a.bookTitle, b.bookTitle));

    const standaloneOnlyChars = sortCharactersAlphabetically(Array.from(unassignedBookChars.values()));
    standaloneOnlyChars.forEach((c) => standaloneAllCharsMap.set(c.id, c));

    const allCharacters = sortCharactersAlphabetically(Array.from(standaloneAllCharsMap.values()));

    seriesGroups.push({
      seriesName: 'Standalone / No Series',
      books: standaloneBooksList,
      standaloneCharacters: standaloneOnlyChars,
      allCharacters,
      totalCharacters: allCharacters.length,
    });
  }

  return seriesGroups.sort((a, b) => {
    if (a.seriesName === 'Standalone / No Series') return 1;
    if (b.seriesName === 'Standalone / No Series') return -1;
    return compareTitlesIgnoringArticles(a.seriesName, b.seriesName);
  });
}

/**
 * Filters series groups based on search query.
 * When titlesOnly is true: ONLY returns series that contain the search term in their main series title.
 * When titlesOnly is false: Returns series whose title matches OR series containing books/characters matching the query.
 */
export function filterSeriesGroups(
  characters: Character[],
  query: string,
  titlesOnly: boolean = false,
  seriesOrders?: Record<string, string[]>,
  bookTimestamps?: Record<string, number>,
  bookSeriesMap: Record<string, string[]> = {}
): SeriesGroup[] {
  const allSeries = groupCharactersBySeries(characters, seriesOrders, bookTimestamps, bookSeriesMap);
  if (!query.trim()) return allSeries;

  const q = query.toLowerCase().trim();

  if (titlesOnly) {
    // Strictly filter by the series main title
    return allSeries.filter((s) => s.seriesName.toLowerCase().includes(q));
  }

  // Content search: Include series where seriesName matches, or any book title/character matches
  return allSeries
    .map((s) => {
      const seriesNameMatches = s.seriesName.toLowerCase().includes(q);
      if (seriesNameMatches) {
        return s;
      }

      // Check if any child books or characters match
      const matchingBooks: { bookTitle: string; characters: Character[] }[] = [];
      s.books.forEach((b) => {
        const bookTitleMatches = b.bookTitle.toLowerCase().includes(q);
        if (bookTitleMatches) {
          matchingBooks.push(b);
        } else {
          const matchingChars = filterCharacters(b.characters, query, false, bookSeriesMap);
          if (matchingChars.length > 0) {
            matchingBooks.push({
              bookTitle: b.bookTitle,
              characters: matchingChars,
            });
          }
        }
      });

      const matchingStandalone = filterCharacters(s.standaloneCharacters, query, false, bookSeriesMap);
      const matchingAll = filterCharacters(s.allCharacters, query, false, bookSeriesMap);

      if (matchingBooks.length > 0 || matchingStandalone.length > 0 || matchingAll.length > 0) {
        const totalChars = new Set<string>();
        matchingBooks.forEach((b) => b.characters.forEach((c) => totalChars.add(c.id)));
        matchingStandalone.forEach((c) => totalChars.add(c.id));

        return {
          ...s,
          books: matchingBooks,
          standaloneCharacters: matchingStandalone,
          allCharacters: matchingAll,
          totalCharacters: totalChars.size || matchingAll.length,
        };
      }

      return null;
    })
    .filter((s): s is SeriesGroup => s !== null);
}

/**
 * Returns suggestions where the first two tags are the most recently clicked/added by the user,
 * and the remainder are ordered by most commonly used (frequency).
 */
export function getUniqueSuggestions(
  characters: Character[],
  bookSeriesMap: Record<string, string[]> = {},
  tagInteractions?: { books?: Record<string, number>; series?: Record<string, number> }
): {
  books: string[];
  series: string[];
} {
  const bookStats = new Map<string, { lastUsed: number; count: number }>();
  const seriesStats = new Map<string, { lastUsed: number; count: number }>();

  characters.forEach((c) => {
    const charTimestamp = Math.max(c.updatedAt || 0, c.createdAt || 0);

    // Collect books
    const charBooks: string[] = [];
    if (Array.isArray(c.books) && c.books.length > 0) {
      c.books.forEach((b) => {
        if (b && b.trim()) charBooks.push(b.trim());
      });
    } else if (c.book && c.book.trim()) {
      charBooks.push(c.book.trim());
    }

    // Deduplicate per character
    new Set(charBooks).forEach((bookName) => {
      const existing = bookStats.get(bookName) || { lastUsed: 0, count: 0 };
      const interactedTimestamp = tagInteractions?.books?.[bookName] || 0;
      const effectiveLastUsed = interactedTimestamp > 0
        ? Math.max(interactedTimestamp, existing.lastUsed)
        : Math.max(existing.lastUsed, charTimestamp);

      bookStats.set(bookName, {
        lastUsed: effectiveLastUsed,
        count: existing.count + 1,
      });
    });

    // Collect series associated with this character via getCharacterSeries
    const charSeries = getCharacterSeries(c, bookSeriesMap);
    new Set(charSeries).forEach((seriesName) => {
      const existing = seriesStats.get(seriesName) || { lastUsed: 0, count: 0 };
      const interactedTimestamp = tagInteractions?.series?.[seriesName] || 0;
      const effectiveLastUsed = interactedTimestamp > 0
        ? Math.max(interactedTimestamp, existing.lastUsed)
        : Math.max(existing.lastUsed, charTimestamp);

      seriesStats.set(seriesName, {
        lastUsed: effectiveLastUsed,
        count: existing.count + 1,
      });
    });
  });

  // Also include books and series from bookSeriesMap
  Object.entries(bookSeriesMap).forEach(([bookTitle, seriesList]) => {
    const cleanBook = bookTitle.trim();
    const bookInteracted = tagInteractions?.books?.[cleanBook] || 0;

    if (cleanBook && !bookStats.has(cleanBook)) {
      bookStats.set(cleanBook, { lastUsed: bookInteracted, count: 1 });
    } else if (cleanBook && bookInteracted > 0) {
      const curr = bookStats.get(cleanBook)!;
      bookStats.set(cleanBook, { lastUsed: Math.max(curr.lastUsed, bookInteracted), count: curr.count });
    }

    if (Array.isArray(seriesList)) {
      seriesList.forEach((s) => {
        const cleanSeries = s.trim();
        if (cleanSeries && cleanBook) {
          const seriesInteracted = tagInteractions?.series?.[cleanSeries] || 0;
          const existing = seriesStats.get(cleanSeries) || { lastUsed: 0, count: 0 };
          const effectiveLastUsed = seriesInteracted > 0
            ? Math.max(existing.lastUsed, seriesInteracted)
            : existing.lastUsed;
          seriesStats.set(cleanSeries, { lastUsed: effectiveLastUsed, count: existing.count + 1 });
        }
      });
    }
  });

  // Overlay any interaction timestamps recorded by the user
  if (tagInteractions?.books) {
    Object.entries(tagInteractions.books).forEach(([bookName, ts]) => {
      const clean = bookName.trim();
      if (!clean) return;
      const existing = bookStats.get(clean);
      if (existing) {
        bookStats.set(clean, { lastUsed: Math.max(existing.lastUsed, ts), count: existing.count });
      }
    });
  }

  if (tagInteractions?.series) {
    Object.entries(tagInteractions.series).forEach(([seriesName, ts]) => {
      const clean = seriesName.trim();
      if (!clean) return;
      const existing = seriesStats.get(clean);
      if (existing) {
        seriesStats.set(clean, { lastUsed: Math.max(existing.lastUsed, ts), count: existing.count });
      }
    });
  }

  // Ensure that if no books have the tag for a particular Book Series, that series is removed from suggestions
  const seriesWithValidBooks = new Set<string>();
  Object.entries(bookSeriesMap).forEach(([bookTitle, sList]) => {
    if (bookTitle.trim() && Array.isArray(sList)) {
      sList.forEach((s) => {
        if (s && s.trim()) seriesWithValidBooks.add(s.trim());
      });
    }
  });
  characters.forEach((c) => {
    const cBooks = Array.isArray(c.books) && c.books.length > 0 ? c.books : (c.book ? [c.book] : []);
    if (cBooks.length > 0) {
      const charSeries = getCharacterSeries(c, bookSeriesMap);
      charSeries.forEach((s) => {
        if (s && s.trim()) seriesWithValidBooks.add(s.trim());
      });
    }
  });

  for (const sName of Array.from(seriesStats.keys())) {
    if (!seriesWithValidBooks.has(sName)) {
      seriesStats.delete(sName);
    }
  }

  const computeOrderedSuggestions = (statsMap: Map<string, { lastUsed: number; count: number }>): string[] => {
    const allItems = Array.from(statsMap.keys());
    if (allItems.length <= 2) {
      return allItems.sort((a, b) => (statsMap.get(b)!.lastUsed - statsMap.get(a)!.lastUsed));
    }

    // Sort all by most recently clicked or added by the user (lastUsed)
    const byRecency = [...allItems].sort((a, b) => (statsMap.get(b)!.lastUsed - statsMap.get(a)!.lastUsed));
    const top2Recent = byRecency.slice(0, 2);
    const remaining = byRecency.slice(2);

    // Sort remaining by most commonly used (count descending), tie-breaking by article-ignored alphabetical order
    remaining.sort((a, b) => {
      const countA = statsMap.get(a)!.count;
      const countB = statsMap.get(b)!.count;
      if (countB !== countA) return countB - countA;
      return compareTitlesIgnoringArticles(a, b);
    });

    return [...top2Recent, ...remaining];
  };

  return {
    books: computeOrderedSuggestions(bookStats),
    series: computeOrderedSuggestions(seriesStats),
  };
}

