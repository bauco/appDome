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
  menuItems: MenuItem[] = [
    {
      identifier: '0',
      label: 'Work & Personal',
      iconName: 'work',
      children: [
        {
          identifier: '1',
          label: 'Work Documents',
          iconName: 'folder_open',
          children: [
            {
              identifier: '1.1',
              label: 'Projects',
              iconName: 'folder_open',
            },
            {
              identifier: '1.2',
              label: 'Tasks',
              iconName: 'task',
            },
          ]
        },
        {
          identifier: '2',
          label: 'Personal Files',
          iconName: 'folder_open',
          children: [
            {
              identifier: '2.1',
              label: 'Photos',
              iconName: 'photo_album',
            },
            {
              identifier: '2.2',
              label: 'Documents',
              iconName: 'insert_drive_file',
            },
          ]
        },
      ]
    },
    {
      identifier: '3',
      label: 'Calendar & Reminders',
      iconName: 'calendar_today',
      children: [
        {
          identifier: '3.1',
          label: 'Work Calendar',
          iconName: 'calendar_today',
        },
        {
          identifier: '3.2',
          label: 'Personal Calendar',
          iconName: 'calendar_today',
        },
        {
          identifier: '3.3',
          label: 'Reminders',
          iconName: 'alarm',
        },
      ]
    },
    {
      identifier: '4',
      label: 'Email & Chat',
      iconName: 'mail',
      children: [
        {
          identifier: '4.1',
          label: 'Work Email',
          iconName: 'mail',
        },
        {
          identifier: '4.2',
          label: 'Personal Email',
          iconName: 'mail',
        },
        {
          identifier: '4.3',
          label: 'Chat',
          iconName: 'chat',
        },
      ]
    },
    {
      identifier: '5',
      label: 'Settings',
      iconName: 'settings',
      children: [
        {
          identifier: '5.1',
          label: 'Account Settings',
          iconName: 'account_circle',
        },
        {
          identifier: '5.2',
          label: 'Notifications',
          iconName: 'notifications',
        },
        {
          identifier: '5.3',
          label: 'Privacy Settings',
          iconName: 'privacy_tip',
        },
      ]
    },
    {
      identifier: '6',
      label: 'Help & Support',
      iconName: 'help_outline',
    },
    {
      identifier: '7',
      label: 'Feedback',
      iconName: 'feedback',
    },
    {
      identifier: '8',
      label: 'About',
      iconName: 'info',
    },
    {
      identifier: '9',
      label: 'Logout',
      iconName: 'logout',
    },
    {
      identifier: '10',
      label: 'Additional Menu',
      iconName: 'add_circle',
      children: [
        {
          identifier: '10.1',
          label: 'Child Item 1',
          iconName: 'subdirectory_arrow_right',
          children: [
            {
              identifier: '10.1.1',
              label: 'Sub Child Item 1',
              iconName: 'subdirectory_arrow_right',
            },
            {
              identifier: '10.1.2',
              label: 'Sub Child Item 2',
              iconName: 'subdirectory_arrow_right',
            },
            {
              identifier: '10.1.3',
              label: 'Sub Child Item 3',
              iconName: 'subdirectory_arrow_right',
            }
          ]
        },
        {
          identifier: '10.2',
          label: 'Child Item 2',
          iconName: 'subdirectory_arrow_right',
        },
        {
          identifier: '10.3',
          label: 'Child Item 3',
          iconName: 'subdirectory_arrow_right',
        }
      ]
    }
  ];

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
