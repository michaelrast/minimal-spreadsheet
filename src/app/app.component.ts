import { Component } from '@angular/core';
import { readElementValue } from '@angular/core/src/render3/util';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'minimal-spreadsheet';

  cols: Array<string> = ['A'];
  rows: Array<Row> = [new Row(this, '1', ['A'])];

  addRow() {
    let firstRow: Row = this.rows[0];

    let startingColNames: Array<string> = [];
    firstRow.columns.forEach(col => {
      startingColNames.push(col.name);
    });
    let newRow: Row = new Row(this , this.getNextRowName, startingColNames);
    this.rows.push(newRow);
  }

  addCol() {
    this.rows.forEach(row => {
      let col: Column = new Column(this, this.getNextColName);
      row.columns.push(col);
    });
    this.cols.push(this.getNextColName)
  }

  /**
   * get method to return the next row name
   */
  get getNextColName(){
    //find the last column name
    let lastColName: string = this.cols[this.cols.length-1];

    //find the next letter in the alphabte
    let code: number = lastColName.charCodeAt(0);
    let nextCode: number = code + 1;
    let col: string = String.fromCharCode(nextCode);
    return col;
  }

  /**
   * get method to return the next row name
   */
  get getNextRowName(): string {
    //find the last row name
    let highest: number = +this.rows[this.rows.length-1].name;

    //add one to it and return the string
    let newRow: number = highest + 1;
    return newRow.toString();
  }

  getValueOfCell(cellString: string): string{
    let letters: string = cellString.replace(/[0-9]/g, '');
    let numbers: string = cellString.replace(letters, '');

    let row: Row = this.rows.find(i => i.name === numbers);
    if(row === undefined){
      return "0"; //if they pass in a row that cannot be found, return 0
    }

    let col: Column = row.columns.find(i => i.name == letters);
    if(col === undefined){
      return "0"; //if they pass in a col that cannot be found, return 0
    }

    return col.cell.displayValue;
  }
}

class Row {
  name: string;
  columns: Array<Column>;

  constructor(component: any, name: string, startingColNames: Array<string>){
    this.name = name;
    this.columns = [];

    startingColNames.forEach(colName => {
      let col: Column = new Column(component, colName);
      this.columns.push(col);
    });
  }
}

class Column {
  name: string;
  cell: Cell;

  constructor(component: any, name: string){
    this.name = name;
    this.cell = new Cell(component);
  }
}

/**
 * class designed to house the logic for displaying and calculating data in the cell
 */
class Cell {
  cellpatt = new RegExp("^[A-Za-z]+.*[0-9]+$");
  componentRef: any;
  dataSelected: boolean = false;

  calcValue: string = '';

  get displayValue() {
    if(!this.calcValue.startsWith('=')){
      return this.calcValue;
    }

    //remove the equals and remove any spaces
    let calcValue: string = this.calcValue.substring(1);
    while(calcValue.includes(' ')){
      calcValue = calcValue.replace(' ', '');
    }

    calcValue = this.replaceCellReferences(calcValue);

    return eval(calcValue);

  };

  constructor(component: any){
    this.componentRef = component;
  }

  onFocus(){
    this.dataSelected = true;
  }
  onBlur(){
    this.dataSelected = false;
  }

  replaceCellReferences(calcValue: string): string {

    let indices: Array<number> = this.getIndexsOfOperators(calcValue);

    let start: number = 0;
    for (let i = 0; i < indices.length; i++) {
      const end = indices[i];
      let section: string = calcValue.substring(start, end);

      if(this.cellpatt.test(section)){
        let sectionValue = this.componentRef.getValueOfCell(section);
        calcValue = calcValue.replace(section, sectionValue);
      }
      
      start = end+1;
    }

    let finalSection: string = calcValue.substring(start);

    if(this.cellpatt.test(finalSection)){
      let sectionValue = this.componentRef.getValueOfCell(finalSection);
      calcValue = calcValue.replace(finalSection, sectionValue);
    }
    
    return calcValue;
  }

  getIndexsOfOperators(value: string): Array<number>{
    let indices: Array<number> = []
    for(var i=0; i<value.length;i++) {
        if (value[i] === "*" || value[i] === "/" || value[i] === "+" || value[i] === "-") indices.push(i);
    }
    return indices;
  }

  containsAnyOperator(value: string): boolean {
    return value.indexOf('*') >= 0 || value.indexOf('/') >= 0 || value.indexOf('+') >= 0 || value.indexOf('-') >= 0
  }
}