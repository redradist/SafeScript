import { Component } from '@angular/core';

function something(num: any) {
  if (typeof num !== "number") {
    throw new TypeError("num is not typeof 'number'");
  }
  console.log(`num is ${num}`);
  return num + 88;
}
// @ts-ignore
something(2);

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'typescript-plugin-angular';
}
