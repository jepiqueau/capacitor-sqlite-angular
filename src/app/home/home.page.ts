import { Component } from '@angular/core';
import { SqliteService } from '../services/sqlite.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  constructor(
    private sqlite: SqliteService
  ) { }

  initDB() {
    console.log('INIT', this.sqlite);
    this.sqlite.initDB();
  }

  printDbList() {
    this.sqlite.printAllDbs();
  }

  printQuery() {
    this.sqlite.printQuery();
  }
}
