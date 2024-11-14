import { Component, inject, OnInit, ViewEncapsulation } from '@angular/core';
import { MenuItem } from './MenuItem';
import { TreeSelectComponent } from './tree-select/tree-select.component';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { catchError, map, Observable, throwError } from 'rxjs';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ TreeSelectComponent,HttpClientModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class AppComponent implements OnInit  {
  private http = inject(HttpClient);

  title = 'appdome';
  menuItems?: MenuItem[];

  ngOnInit(): void {
    console.log(this.menuItems)
    this.get().pipe(
      map(response =>{
        console.log(response)
        this.menuItems = response;
      }),
      catchError( (error: any) => {
        console.error(error);
        return throwError(()=> error);
      })
    ).subscribe();
  }
  get<T>(): Observable<MenuItem[]> {
    return this.http.get<MenuItem[]>('/api/process-tree', { observe:'response' }).pipe(
      map((response: any) => {
        if(response.status === 200){
          return response.body;
        }else{
          throw response.body;
        }
      }),
      catchError( (error: any) => {
        console.error(error);
        return throwError(()=> error);
      })
    );
  }
}
