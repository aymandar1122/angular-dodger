import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  PLATFORM_ID,
  ViewChild,
  inject,
  signal
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Enemy, GameState, Player } from './models/game.model';
import { rectsOverlap } from './lib/collision';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements AfterViewInit, OnDestroy {
  @ViewChild('gameCanvas', { static: true })
  private readonly canvasRef!: ElementRef<HTMLCanvasElement>;

  protected readonly state = signal<GameState>(this.createInitialState());

  private context!: CanvasRenderingContext2D;
  private animationFrameId?: number;
  private lastFrameTime = 0;
  private lastSpawnTime = 0;
  private readonly spawnInterval = 1200;
  private readonly enemySpeedRange = { min: 90, max: 160 };
  private readonly keysPressed = new Set<string>();
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  ngAfterViewInit(): void {
    if (!this.isBrowser) {
      return;
    }

    const canvas = this.canvasRef.nativeElement;
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Unable to initialise canvas context.');
    }

    this.context = context;
    this.resetGame();
    this.startLoop();
  }

  ngOnDestroy(): void {
    if (this.isBrowser && this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    if (!this.isBrowser) {
      return;
    }

    const key = event.key.toLowerCase();
    if (key === 'arrowleft' || key === 'a' || key === 'arrowright' || key === 'd') {
      this.keysPressed.add(key);
      event.preventDefault();
    }

    if (event.key === ' ' && this.state().gameOver) {
      event.preventDefault();
      this.restart();
    }
  }

  @HostListener('window:keyup', ['$event'])
  handleKeyUp(event: KeyboardEvent): void {
    if (!this.isBrowser) {
      return;
    }

    this.keysPressed.delete(event.key.toLowerCase());
  }

  restart(): void {
    if (!this.isBrowser) {
      return;
    }

    this.resetGame();
  }

  private resetGame(): void {
    if (!this.isBrowser) {
      return;
    }

    const canvas = this.canvasRef.nativeElement;
    const initialState = this.createInitialState();

    initialState.player = {
      ...initialState.player,
      x: canvas.width / 2 - initialState.player.width / 2,
      y: canvas.height - initialState.player.height - 20
    };

    this.state.set(initialState);
    this.lastSpawnTime = performance.now();
    this.lastFrameTime = performance.now();
    this.keysPressed.clear();
  }

  private createInitialState(): GameState {
    return {
      player: {
        x: 0,
        y: 0,
        width: 40,
        height: 40,
        speed: 260
      },
      enemies: [],
      score: 0,
      gameOver: false
    };
  }

  private startLoop(): void {
    if (!this.isBrowser) {
      return;
    }

    const loop = (timestamp: number) => {
      const delta = timestamp - this.lastFrameTime;
      this.lastFrameTime = timestamp;

      if (!this.state().gameOver) {
        this.updateGame(delta, timestamp);
      }

      this.drawScene();
      this.animationFrameId = requestAnimationFrame(loop);
    };

    this.animationFrameId = requestAnimationFrame((timestamp) => {
      this.lastFrameTime = timestamp;
      loop(timestamp);
    });
  }

  private updateGame(deltaMs: number, timestamp: number): void {
    const canvas = this.canvasRef.nativeElement;
    const state = this.state();
    const delta = deltaMs / 1000;

    const player = this.movePlayer(state.player, delta, canvas.width);
    const enemiesWithNewSpawn = this.maybeSpawnEnemy(state.enemies, timestamp, canvas);

    let scoreGain = 0;
    let collided = false;
    const activeEnemies: Enemy[] = [];

    for (const enemy of enemiesWithNewSpawn) {
      const nextEnemy = { ...enemy, y: enemy.y + enemy.speed * delta };

      if (!collided && rectsOverlap(player, nextEnemy)) {
        collided = true;
      }

      if (nextEnemy.y > canvas.height) {
        scoreGain++;
        continue;
      }

      activeEnemies.push(nextEnemy);
    }

    this.state.set({
      player,
      enemies: activeEnemies,
      score: state.score + scoreGain,
      gameOver: collided
    });
  }

  private movePlayer(player: Player, delta: number, canvasWidth: number): Player {
    let direction = 0;
    if (this.keysPressed.has('arrowleft') || this.keysPressed.has('a')) {
      direction -= 1;
    }
    if (this.keysPressed.has('arrowright') || this.keysPressed.has('d')) {
      direction += 1;
    }

    const distance = direction * player.speed * delta;
    const nextX = Math.min(
      Math.max(0, player.x + distance),
      canvasWidth - player.width
    );

    if (nextX === player.x) {
      return player;
    }

    return { ...player, x: nextX };
  }

  private maybeSpawnEnemy(enemies: Enemy[], timestamp: number, canvas: HTMLCanvasElement): Enemy[] {
    if (timestamp - this.lastSpawnTime < this.spawnInterval) {
      return enemies;
    }

    this.lastSpawnTime = timestamp;
    const enemy = this.createEnemy(canvas);
    return [...enemies, enemy];
  }

  private createEnemy(canvas: HTMLCanvasElement): Enemy {
    const width = 36;
    const height = 36;
    const x = Math.random() * (canvas.width - width);
    const speed = this.randomBetween(this.enemySpeedRange.min, this.enemySpeedRange.max);

    return {
      x,
      y: -height,
      width,
      height,
      speed
    };
  }

  private drawScene(): void {
    const canvas = this.canvasRef.nativeElement;
    const context = this.context;
    const state = this.state();

    context.fillStyle = '#0f172a';
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = '#38bdf8';
    context.fillRect(
      state.player.x,
      state.player.y,
      state.player.width,
      state.player.height
    );

    context.fillStyle = '#f87171';
    for (const enemy of state.enemies) {
      context.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    }
  }

  private randomBetween(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }
}
