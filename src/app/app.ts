import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameCanvasComponent } from './game-canvas/game-canvas';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, GameCanvasComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
})
export class AppComponent {}
