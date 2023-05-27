/*
Import all interface types here
*/
import { firestore } from 'firebase-admin';
import { Geolocation } from '@usekeepers/keepers-shared';
import { geohashQueryBounds, distanceBetween } from 'geofire-common';

import { QueryBuilder } from './queryBuilder';

/**
 * Retrieves all keys of an object. Nested keys are separated by '.'
 */
export type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

type GeoqueryOpts = {
  onlyKeepers?: boolean;
  onlyActive?: boolean;
  onlyKeeperActive?: boolean;
};

/**
 * A helper class to register a collection.
 */
export class RegisterCollection<T extends object> {
  private collection: string;

  /**
   * Registers a Firestore collection. This allows for a complete typing system throughout the app.
   * @typeParam T - an object that defines the document
   * @param collectionName The name of the collection where the documents should be stores or retrieved.
   */
  constructor(collectionName: string) {
    this.collection = collectionName;
  }

  get queryBuilder() {
    return new QueryBuilder<T>(this.collection).withConverter(
      this.converter<T>()
    );
  }

  /**
   * The converter helper.
   * @private
   * @returns FirestoreDocument<T>
   */
  private converter = <T>() => ({
    toFirestore: (data: Partial<T>) => data,
    fromFirestore: (snapshot: FirebaseFirestore.QueryDocumentSnapshot) =>
      snapshot.data() as T,
  });

  /**
   * Query the firestore collection with dynamic where clause.
   * @param where
   * @returns {typeof T[]} Firestore.Document[]
   */
  public get = async (
    ...where: [NestedKeyOf<T>, firestore.WhereFilterOp, unknown][]
  ): Promise<T[]> => {
    let query: Promise<firestore.QuerySnapshot<T>>;

    if (!where) {
      query = firestore()
        .collection(this.collection)
        .withConverter(this.converter<T>())
        .get();
    } else {
      // TODO: fix this typing, this should not be any but it 'works' for now
      let colQuery = firestore().collection(
        this.collection
      ) as firestore.Query<firestore.DocumentData>;

      for (const [key, operator, value] of where) {
        colQuery = colQuery.where(key, operator, value);
      }

      query = colQuery.withConverter(this.converter<T>()).get();
    }
    const results: T[] = [];

    await query.then((snap) => {
      snap.docs.forEach((doc) => results.push({ ...doc.data(), id: doc.id }));
    });

    return results;
  };

  /**
   * Query the firestore collection with dynamic where clause.
   * @param where
   * @returns {typeof T[]} Firestore.Document[]
   */
  public getSingle = async (
    ...where: [NestedKeyOf<T>, firestore.WhereFilterOp, unknown][]
  ): Promise<T> => {
    const results = await this.get(...where);
    return results[0];
  };

  /**
   * Queries all documents within the range of the center provided given a specified radius.
   * This query will *NOT* work unless the documents being queried contain a Geolocation object at the root level of the document.
   * @param center A geolocation object of the location we're trying to query for.
   * @param radiusInKm Radius in kilometers that you'd like to query.
   * @param opts Optional.
   * @returns {typeof T[]} Firestore.Document[]
   */
  public getWithinRange = async (
    center: Geolocation,
    radiusInKm: number,
    opts: GeoqueryOpts = {
      onlyKeepers: true,
      onlyActive: true,
      onlyKeeperActive: true,
    }
  ) => {
    const bounds = geohashQueryBounds(
      [center.latitude, center.longitude],
      radiusInKm * 1000
    );

    const promises: Promise<firestore.QuerySnapshot<T>>[] = [];
    for (const b of bounds) {
      const query = firestore()
        .collection(this.collection)
        .withConverter(this.converter<T>())
        .orderBy('geocoding.hash')
        .startAt(b[0])
        .endAt(b[1]);

      promises.push(query.get());
    }

    const results: T[] = [];

    await Promise.all(promises).then((snapshots) => {
      for (const snap of snapshots) {
        for (const doc of snap.docs) {
          const lat = parseFloat(doc.get('geocoding.latitude'));
          const lng = parseFloat(doc.get('geocoding.longitude'));
          const isKeeper = doc.get('keeperAccount');
          const isKeeperActive = doc.get('keeperAccountActive');
          const isActive = doc.get('active');
          const distanceInKm = distanceBetween(
            [lat, lng],
            [center.latitude, center.longitude]
          );
          const distanceInM = distanceInKm * 1000;
          if (distanceInM <= radiusInKm * 1000) {
            if (opts.onlyKeepers) {
              // only add if they're a keeper and if they're active
              if (isKeeper) {
                if (opts.onlyKeeperActive) {
                  if (isKeeperActive)
                    results.push({ ...doc.data(), id: doc.id });
                } else {
                  results.push({ ...doc.data(), id: doc.id });
                }
              }
            } else {
              if (opts.onlyActive) {
                if (isActive) results.push({ ...doc.data(), id: doc.id });
              } else {
                results.push({ ...doc.data(), id: doc.id });
              }
            }
          }
        }
      }
    });

    return results;
  };

  /**
   * Query firestore for a specific document within the collection.
   * @param documentId
   * @returns {typeof T} Firestore.Document
   */
  public getById = async (documentId: string): Promise<T | undefined> =>
    await (
      await firestore()
        .doc(this.collection + '/' + documentId)
        .withConverter(this.converter<T>())
        .get()
    ).data();

  /**
   * Get the reference of a document.
   * @param documentId
   * @returns Promise<firestore.DocumentReference<typeof T>>
   */
  public getRef = async (documentId: string) =>
    firestore()
      .doc(this.collection + '/' + documentId)
      .withConverter(this.converter<T>());

  /**
   * A reference to a new document to be created.
   * @returns Promise<firestore.DocumentReference<firestore.DocumentData>>
   */
  public addRef = async () => firestore().collection(this.collection).doc();

  /**
   * Add a document to the given collection.
   * @param document
   * @returns Promise<firestore.DocumentReference<typeof T>>
   */
  public add = async (document: T) =>
    await firestore()
      .collection(this.collection)
      .withConverter(this.converter<T>())
      .add(document);

  /**
   * Upsert a document. This merges with existing data when updating.
   * @param documentId
   * @param document
   * @returns Promise<firestore.DocumentReference<T>>
   */
  public upsert = async (documentId: string, document: Partial<T>) =>
    await firestore()
      .doc(this.collection + '/' + documentId)
      .withConverter(this.converter<T>())
      .set(document, { merge: true });

  public replace = async (documentId: string, document: Partial<T>) =>
    await firestore()
      .doc(this.collection + '/' + documentId)
      .withConverter(this.converter<T>())
      .set(document, { merge: false });

  /**
   * Delete a document
   * @param documentId
   * @returns Promise<firestore.WriteResult>
   */
  public delete = async (documentId: string) =>
    await firestore()
      .doc(this.collection + '/' + documentId)
      .delete();

  /**
   *
   * @param id documentid to run a transaction for
   * @param update update function
   */
  public transaction = async (
    id: string,
    update: (
      ref: firestore.DocumentReference<T>,
      transaction: firestore.Transaction
    ) => Promise<void>
  ) => {
    await firestore().runTransaction(async (transaction) =>
      update(
        firestore()
          .doc(this.collection + '/' + id)
          .withConverter(this.converter<T>()),
        transaction
      )
    );
  };
}
