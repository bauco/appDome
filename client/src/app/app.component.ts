import { Component, DestroyRef, inject, OnInit, ViewEncapsulation } from '@angular/core';
import { MenuItem } from './MenuItem';
import { TreeSelectComponent } from './tree-select/tree-select.component';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { catchError, map, Observable, Subject, Subscription, throwError } from 'rxjs';
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
  protected destroyRef = inject(DestroyRef);

  title = 'appdome';
  menuItems?: MenuItem[];
  private menuItemsSubject: Subject<MenuItem[]> = new Subject<MenuItem[]>();

  private socket = new WebSocket('ws://localhost:8080'); // WebSocket connection URL
  private headers: HttpHeaders= new HttpHeaders({
    'Content-Type': 'application/json-patch+json',
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Access-Control-Allow-Headers': "Origin, Content-Type, Accept, Authorization",
    'Access-Control-Allow-Origin': 'https://localhost:4200/, https://localhost:3000/',
    'Access-Control-Allow-Credentials': 'true',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Accept': 'text/plain',
  });
  ngOnInit(): void {
    console.log(this.menuItems)
    let subscriber = this.get().pipe(
      map(response =>{
        console.log(response)
        this.menuItems = response;
      }),
      catchError( (error: any) => {
        console.error(error);
        return throwError(()=> error);
      })
    ).subscribe();
    this.destroyRef.onDestroy(() => { subscriber.unsubscribe(); });

    // Listen for messages from the server
    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if(data.action === 'getTree'){
        let subscribe = this.get().pipe(
          map(response =>{
            console.log(response)
            this.menuItems = response;
          }),
          catchError( (error: any) => {
            console.error(error);
            return throwError(()=> error);
          })
        ).subscribe();
        this.destroyRef.onDestroy(() => { subscribe.unsubscribe(); });

      }
    };

    // Handle WebSocket errors
    this.socket.onerror = (error) => {
      console.error('WebSocket Error: ', error);
    };

    // Handle WebSocket closure
    this.socket.onclose = (event) => {
      console.log('WebSocket Closed: ', event);
    };

    this.listenForDataUpdates().subscribe((update)=>{
      this.menuItems = update;
      console.log("updated")
    })
  }


  // Provide the received messages as an Observable
  listenForDataUpdates() {
    return this.menuItemsSubject.asObservable();
  }

  get<T>(): Observable<MenuItem[]> {
    return this.http.get<MenuItem[]>('/api/process-tree', { observe:'response' , headers: this.headers}).pipe(
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
