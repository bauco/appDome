import { Component, ViewEncapsulation } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MenuItem } from './MenuItem';
import { TreeSelectComponent } from './tree-select/tree-select.component';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, TreeSelectComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class AppComponent  {

  title = 'appdome';
  menuItems: MenuItem[] = 
  [
    {
      identifier: '0',
      label: "Documents",
      iconName: "folder",
      children: [
        {
          identifier: '1',
          label: "Work",
          iconName: "settings",
          children: [
            {
              identifier: '1',
              label: "Work",
              iconName: "settings",
            },
            {
              identifier: '2',
              label: "Home",
              iconName: "home",
            }
          ]
        },
        {
          identifier: '2',
          label: "Home",
          iconName: "home",
        }
      ]
    },
   {
      identifier: '3',
      label: "Events",
      iconName: "calendar_today",
      children: [],
    },
    {
      identifier: '4',
      label: "Movies",
      iconName: "star",
      iconFill: true,
      children: [],
    }
  ]
  ;

  ngOnInit(): void {
    console.log(this.menuItems)
  }
}
