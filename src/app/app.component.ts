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

  /**
   * btn method to add a row
   */
  addRow() {
    //create a new row and push it into the rows array
    let newRow: Row = new Row(this , this.getNextRowName, this.cols);
    this.rows.push(newRow);
  }

  /**
   * btn method to add a column
   */
  addCol() {
    //loop through all the rows and push a column into the column list with the correct name
    this.rows.forEach(row => {
      let col: Column = new Column(this, this.getNextColName);
      row.columns.push(col);
    });

    //add the Header column value
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

  /**
   * btn to move row up
   * @param row row to move
   */
  rowUp(row: Row) {
    let index: number = +row.name - 1;

    //cannot move up first row
    if(index === 0){
      alert("Cannot move first row up");
    }
    //remove from list
    this.rows.splice(index, 1);

    //find index to move to and put value there
    let indexToMoveTo: number = index - 1;
    this.rows.splice(indexToMoveTo, 0, row);

    this.fixRowNumbers();
  }

  /**btn to move row down */
  rowDown(row: Row) {
    let index: number = +row.name - 1;

    //cannot move up first row
    if(index === this.rows.length-1){
      alert("Cannot move last row down");
    }
    //remove from list
    this.rows.splice(index, 1);

    //find index to move to and put value there
    let indexToMoveTo: number = index + 1;
    this.rows.splice(indexToMoveTo, 0, row);

    this.fixRowNumbers();
  }

  fixRowNumbers(){
    //fix row numbers
    for (let i = 0; i < this.rows.length; i++) {
      this.rows[i].name = (i+1).toString();
    }
  }

  /**
   * method that will take in a cell indicator and return the value of that cell
   * @param cellString Cell indicator (ex: A1)
   */
  getValueOfCell(cellString: string): string{
    //get the letters portion and the numbers portion of the string
    let letters: string = cellString.replace(/[0-9]/g, '');
    let numbers: string = cellString.replace(letters, '');

    //find the row by the number
    let row: Row = this.rows.find(i => i.name === numbers);
    if(row === undefined){
      return "0"; //if they pass in a row that cannot be found, return 0
    }

    //find the column by the letters
    let col: Column = row.columns.find(i => i.name == letters);
    if(col === undefined){
      return "0"; //if they pass in a col that cannot be found, return 0
    }

    return col.cell.displayValue !== "" ? col.cell.displayValue : "0";
  }
}

/**
 * Class to house the logic for a Row object
 */
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

/**
 * Class to house the logic for a Column object
 */
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

  /**
   * get method to return the display value of the cell
   */
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

  /**method to call when the cell is focused on */
  onFocus(){
    this.dataSelected = true;
  }
  /**method to call when the cell removes focus */
  onBlur(){
    this.dataSelected = false;
  }

  /**
   * will take in a string and return the string with the Cell References replaced with the correct value
   * @param calcValue calcValue: string to process (ex: A1+B2)
   */
  replaceCellReferences(calcValue: string): string {

    let indexDif: number = 0;
    let indices: Array<number> = this.getIndexsOfOperators(calcValue);

    let start: number = 0;
    for (let i = 0; i < indices.length; i++) {
      const end = indices[i];
      let section: string = calcValue.substring(start + indexDif, end + indexDif);

      if(this.cellpatt.test(section)){
        let sectionValue = this.componentRef.getValueOfCell(section);
        calcValue = calcValue.replace(section, sectionValue);
        indexDif = indexDif + sectionValue.length - section.length;
      }
      
      start = end+1;
    }

    let finalSection: string = calcValue.substring(start + indexDif);

    if(this.cellpatt.test(finalSection)){
      let sectionValue = this.componentRef.getValueOfCell(finalSection);
      calcValue = calcValue.replace(finalSection, sectionValue);
    }
    
    return calcValue;
  }

  /**method to get the indexs where the operators are located in a string */
  getIndexsOfOperators(value: string): Array<number>{
    let indices: Array<number> = []
    for(var i=0; i<value.length;i++) {
        if (value[i] === "*" || value[i] === "/" || value[i] === "+" || value[i] === "-") indices.push(i);
    }
    return indices;
  }

  /**returns if the string has an operator in it */
  containsAnyOperator(value: string): boolean {
    return value.indexOf('*') >= 0 || value.indexOf('/') >= 0 || value.indexOf('+') >= 0 || value.indexOf('-') >= 0
  }
}