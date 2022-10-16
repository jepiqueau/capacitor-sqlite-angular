import { Injectable } from '@angular/core';
import { CapacitorSQLite, Changes, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { Platform } from '@ionic/angular';
import { BehaviorSubject } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { SQLConnectionNotReadyError } from './errors/connection-not-ready-error';

const READONLY = false;

@Injectable({
  providedIn: 'root'
})
export class SqliteOfficialService {
  native: boolean = this.isNative();
  platform = Capacitor.getPlatform();

  sqliteConnection: SQLiteConnection = new SQLiteConnection(CapacitorSQLite);

  private ready$ = new BehaviorSubject<boolean>(false);

  constructor(private platformService: Platform) {
    if (this.platform === 'web') {
      this.initWeb();
    } else {
      this.ready$.next(true);
    }
  }
  getPlatform() {
    return this.platform;
  }
  /**
   * Does some stuff, which is necessary for the web platform
   */
  async initWeb() {
    await this.platformService.ready();
    await customElements.whenDefined('jeep-sqlite');

    const jeepSqliteEl = document.querySelector('jeep-sqlite');

    if (jeepSqliteEl !== null) {
      await this.sqliteConnection.initWebStore();
      this.ready$.next(true);
    } else {
      console.error('Cannot init web. Cannot find "jeepSqliteEl" element in dom.');
    }
  }


  /**
   * Echo a value
   *
   * @param value
   */
  async echo(value: string): Promise<string> {
    await this.ready('echo');
    const result = await this.sqliteConnection.echo(value);

    return result.value;
  }

  async openDB(databasename: string, version: number = 1): Promise<SQLiteDBConnection> {
    await this.ready('openDB');

    // connectionConsistency: mindestens eine Verbindung ist offen
    const connectionConsistency = (await this.sqliteConnection.checkConnectionsConsistency()).result;
    const connectionToDatabaseAlreadyOpen = (await this.sqliteConnection.isConnection(databasename, READONLY)).result;

    let dbConnection: SQLiteDBConnection;

    if (connectionConsistency && connectionToDatabaseAlreadyOpen) {
      dbConnection = await this.sqliteConnection.retrieveConnection(databasename, READONLY);
    } else {
      dbConnection = await this.sqliteConnection
        .createConnection(databasename, false, 'no-encryption', version, READONLY);
    }
    await dbConnection.open();

    return dbConnection;
  }

  async isSecretStored(): Promise<boolean> {
    if (!this.native) {
      throw new Error(`Not implemented for ${this.platform} platform`);
    }

    await this.ready('isSecretStored');

    const result = await this.sqliteConnection.isSecretStored();

    return result.result;
  }

  async setEncryptionSecret(passphrase: string): Promise<void> {
    await this.ready('isSecretStored');

    return this.sqliteConnection.setEncryptionSecret(passphrase);
  }

  async changeEncryptionSecret(passphrase: string, oldpassphrase: string): Promise<void> {
    if (!this.native) {
      return Promise.reject(new Error(`Not implemented for ${this.platform} platform`));
    }

    await this.ready('changeEncryptionSecret');

    return this.sqliteConnection.changeEncryptionSecret(passphrase, oldpassphrase);
  }

  /**
   * addUpgradeStatement
   *
   * @param database
   * @param fromVersion
   * @param toVersion
   * @param statement
   * @param set
   */
  async addUpgradeStatement(
    database: string,
    toVersion: number,
    statements: string[],
  ): Promise<void> {
    await this.ready('addUpgradeStatement');
    return this.sqliteConnection.addUpgradeStatement(database, toVersion, statements);
  }

  /**
   * get a non-conformed database path
   *
   * @param path
   * @param database
   * @returns Promise<capNCDatabasePathResult>
   * @since 3.3.3-1
   */
  async getNCDatabasePath(folderPath: string, database: string): Promise<string | undefined> {
    await this.ready('getNCDatabasePath');
    const result = await this.sqliteConnection.getNCDatabasePath(folderPath, database);

    return result.path;
  }
  /**
   * Create a non-conformed database connection
   *
   * @param databasePath
   * @param version
   * @returns Promise<SQLiteDBConnection>
   * @since 3.3.3-1
   */
  async createNCConnection(databasePath: string, version: number): Promise<SQLiteDBConnection> {
    await this.ready('createNCConnection');
    const db: SQLiteDBConnection = await this.sqliteConnection.createNCConnection(databasePath, version);
    if (db !== null) {
      return db;
    } else {
      throw new Error(`no db returned is null`);
    }
  }
  /**
   * Close a non-conformed database connection
   *
   * @param databasePath
   * @returns Promise<void>
   * @since 3.3.3-1
   */
  async closeNCConnection(databasePath: string): Promise<void> {
    await this.ready('closeNCConnection');
    return this.sqliteConnection.closeNCConnection(databasePath);
  }

  /**
   * Check if a non-conformed databaseconnection exists
   *
   * @param databasePath
   * @returns Promise<boolean>
   * @since 3.3.3-1
   */
  async isNCConnection(databasePath: string): Promise<boolean> {
    await this.ready('retrieveNCConnection');
    const result = await this.sqliteConnection.isNCConnection(databasePath);

    return result.result;
  }

  /**
   * Retrieve a non-conformed database connection
   *
   * @param databasePath
   * @returns Promise<SQLiteDBConnection>
   * @since 3.3.3-1
   */
  async retrieveNCConnection(databasePath: string): Promise<SQLiteDBConnection> {
    await this.ready('retrieveNCConnection');
    return this.sqliteConnection.retrieveNCConnection(databasePath);
  }

  /**
   * Check if a non conformed database exists
   *
   * @param databasePath
   * @returns Promise<boolean>
   * @since 3.3.3-1
   */
  async isNCDatabase(databasePath: string): Promise<boolean> {
    await this.ready('isNCDatabase');
    const result = await this.sqliteConnection.isNCDatabase(databasePath);

    return result.result;
  }

  /**
   * Create a connection to a database
   *
   * @param database
   * @param encrypted
   * @param mode
   * @param version
   */
  async createConnection(database: string, encrypted: boolean,
    mode: string, version: number
  ): Promise<SQLiteDBConnection> {
    await this.ready('createConnection');
    const db: SQLiteDBConnection = await this.sqliteConnection.createConnection(database, encrypted, mode, version, READONLY);

    if (db != null) {
      return db;
    } else {
      throw new Error(`no db returned is null`);
    }
  }

  /**
   * Close a connection to a database
   *
   * @param database
   */
  async closeConnection(database: string): Promise<void> {
    await this.ready('closeConnection');
    return this.sqliteConnection.closeConnection(database, READONLY);
  }
  /**
   * Retrieve an existing connection to a database
   *
   * @param database
   */
  async retrieveConnection(database: string): Promise<SQLiteDBConnection> {
    await this.ready('retrieveConnection');
    return this.sqliteConnection.retrieveConnection(database, READONLY);
  }

  /**
   * Retrieve all existing connections
   */
  async retrieveAllConnections(): Promise<Map<string, SQLiteDBConnection>> {
    await this.ready('retrieveAllConnections');
    const myConns = await this.sqliteConnection.retrieveAllConnections();
    /*                let keys = [...myConns.keys()];
                    keys.forEach( (value) => {
                        console.log("Connection: " + value);
                    });
    */
    return myConns;
  }

  /**
   * Close all existing connections
   */
  async closeAllConnections(): Promise<void> {
    await this.ready('closeAllConnections');
    return this.sqliteConnection.closeAllConnections();
  }

  /**
   * Check if connection exists
   *
   * @param database
   */
  async isConnection(database: string): Promise<boolean> {
    await this.ready('isConnection');
    const result = await this.sqliteConnection.isConnection(database, READONLY);

    return result.result;
  }

  /**
   * Check Connections Consistency
   *
   * @returns
   */
  async checkConnectionsConsistency(): Promise<boolean> {
    await this.ready('checkConnectionsConsistency');
    const result = await this.sqliteConnection.checkConnectionsConsistency();

    return result.result;
  }

  /**
   * Check if database exists
   *
   * @param database
   */
  async databaseExists(database: string): Promise<boolean> {
    await this.ready('isDatabase');
    const result = await this.sqliteConnection.isDatabase(database);
    return result.result;
  }
  /**
   * Get the list of databases
   */
  async getDatabaseList(): Promise<string[]> {
    await this.ready('getDatabaseList');
    const result = await this.sqliteConnection.getDatabaseList();

    return result.values;
  }
  /**
   * Get Migratable databases List
   */
  async getMigratableDbList(folderPath: string): Promise<any[]> {
    this.ensureNative();
    await this.ready('getMigratableDbList');

    if (!folderPath || folderPath.length === 0) {
      throw (new Error(`You must provide a folder path`));
    }
    const result = await this.sqliteConnection.getMigratableDbList(folderPath);

    return result.values;
  }

  /**
   * Add "SQLite" suffix to old database's names
   */
  async addSQLiteSuffix(folderPath?: string, dbNameList?: string[]): Promise<void> {
    this.ensureNative();
    await this.ready('addSQLiteSuffix');

    const path: string = folderPath ? folderPath : 'default';
    const dbList: string[] = dbNameList ? dbNameList : [];
    return this.sqliteConnection.addSQLiteSuffix(path, dbList);
  }

  /**
   * Delete old databases
   */
  async deleteOldDatabases(folderPath?: string, dbNameList?: string[]): Promise<void> {
    this.ensureNative();
    await this.ready('deleteOldDatabases');

    const path: string = folderPath ? folderPath : 'default';
    const dbList: string[] = dbNameList ? dbNameList : [];
    return this.sqliteConnection.deleteOldDatabases(path, dbList);
  }

  /**
   * Import from a Json Object
   *
   * @param jsonstring
   */
  async importFromJson(jsonstring: string): Promise<Changes> {
    await this.ready('importFromJson');
    const result = await this.sqliteConnection.importFromJson(jsonstring);

    return result.changes;
  }

  /**
   * Is Json Object Valid
   *
   * @param jsonstring Check the validity of a given Json Object
   */

  async isJsonValid(jsonstring: string): Promise<boolean> {
    await this.ready('isJsonValid');
    const result = await this.sqliteConnection.isJsonValid(jsonstring);

    return result.result;
  }

  /**
   * Copy databases from public/assets/databases folder to application databases folder
   */
  async copyFromAssets(overwrite?: boolean): Promise<void> {
    const mOverwrite: boolean = overwrite != null ? overwrite : true;
    console.log(`&&&& mOverwrite ${mOverwrite}`);

    return this.sqliteConnection.copyFromAssets(mOverwrite);
  }

  /**
   * Initialize the Web store
   *
   * @param database
   */
  async initWebStore(): Promise<void> {
    if (this.platform !== 'web') {
      //throw new Error(`not implemented for this platform: ${this.platform}`);
      return;
    }

    return this.sqliteConnection.initWebStore();
  }

  /**
   * Save a database to store
   *
   * @param database
   */
  async saveToStore(database: string): Promise<void> {
    if (this.platform !== 'web') {
      //return Promise.reject(new Error(`not implemented for this platform: ${this.platform}`));
      return;
    }

    return this.sqliteConnection.saveToStore(database);
  }

  /**
   * Drops a database
   *
   * @param databaseName
   * @returns
   */
  async dropDatabase(databaseName: string): Promise<void> {
    await this.ready('deleteDatabase');

    const dbConnection = await this.openDB(databaseName);

    await dbConnection.delete();
  }

  private isNative() {
    return this.platform === 'ios' || this.platform === 'android';
  }

  private ensureNative() {
    if (!this.native) {
      throw new Error(`Not implemented for ${this.platform} platform`);
    }
  }

  private ready(methodname: string, waitMs: number = 1000): Promise<void> {
    return new Promise((resolve) => {
      let success = false;

      setTimeout(() => {
        if (!success) {
          throw new SQLConnectionNotReadyError(methodname);
        }
      }, waitMs);

      this.ready$.pipe(filter(isReady => !!isReady), take(1))
        .subscribe(() => {
          if (!success) {
            success = true;
            resolve();
          }
        });
    });
  }
}
