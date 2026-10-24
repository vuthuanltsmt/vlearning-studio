const DB_NAME =
  "vlearning-studio-slide-db";

const DB_VERSION =
  1;

const STORE_NAME =
  "slides";

function openDb():
  Promise<IDBDatabase> {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      const request =
        indexedDB.open(
          DB_NAME,
          DB_VERSION
        );

      request.onupgradeneeded =
        () => {
          const db =
            request.result;

          if (
            !db.objectStoreNames.contains(
              STORE_NAME
            )
          ) {
            db.createObjectStore(
              STORE_NAME
            );
          }
        };

      request.onsuccess =
        () =>
          resolve(
            request.result
          );

      request.onerror =
        () =>
          reject(
            request.error
          );
    }
  );
}

export async function saveSlideImage(
  pageId: string,
  blob: Blob
) {
  const db =
    await openDb();

  await new Promise<void>(
    (
      resolve,
      reject
    ) => {
      const transaction =
        db.transaction(
          STORE_NAME,
          "readwrite"
        );

      transaction.objectStore(
        STORE_NAME
      ).put(
        blob,
        pageId
      );

      transaction.oncomplete =
        () =>
          resolve();

      transaction.onerror =
        () =>
          reject(
            transaction.error
          );
    }
  );

  db.close();
}

export async function getSlideImage(
  pageId: string
): Promise<Blob | null> {
  const db =
    await openDb();

  try {
    return await new Promise<
      Blob | null
    >(
      (
        resolve,
        reject
      ) => {
        const transaction =
          db.transaction(
            STORE_NAME,
            "readonly"
          );

        const request =
          transaction.objectStore(
            STORE_NAME
          ).get(
            pageId
          );

        request.onsuccess =
          () => {
            const value =
              request.result;

            resolve(
              value instanceof Blob
                ? value
                : null
            );
          };

        request.onerror =
          () =>
            reject(
              request.error
            );
      }
    );
  } finally {
    db.close();
  }
}
