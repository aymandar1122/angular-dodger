import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, NgZone, ViewChild } from '@angular/core'
type Rect = { x:number; y:number; w:number; h:number }

@Component({
  selector: 'app-game-canvas',
  standalone: true,
  templateUrl: './game-canvas.html',
  styleUrls: ['./game-canvas.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameCanvasComponent implements AfterViewInit {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>

  private ctx!: CanvasRenderingContext2D
  private W = 800; private H = 500
  private dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2))

  private keys = new Set<string>()
  private touchDir: -1|0|1 = 0
  private last = 0
  private spawnTimer = 0
  private spawnEvery = 900
  private running = true
  private over = false

  score = 0
  hi = Number(localStorage.getItem('hi') || 0)

  private player: Rect = { x: 380, y: 440, w: 40, h: 40 }
  private enemies: Rect[] = []

  constructor(private zone: NgZone) {}

  ngAfterViewInit() {
    const c = this.canvasRef.nativeElement
    const ctx = c.getContext('2d'); if (!ctx) throw new Error('no 2d ctx'); this.ctx = ctx
    this.resize(); addEventListener('resize', () => this.resize())

    addEventListener('keydown', e => {
      if (e.key === 'r' || e.key === 'R') this.restart()
      if (e.key === 'p' || e.key === 'P') this.running = !this.running
      this.keys.add(e.key)
    })
    addEventListener('keyup', e => this.keys.delete(e.key))

    c.addEventListener('pointerdown', e => {
      const r = c.getBoundingClientRect()
      this.touchDir = (e.clientX - r.left) < r.width / 2 ? -1 : 1
    })
    addEventListener('pointerup', () => (this.touchDir = 0))

    this.zone.runOutsideAngular(() => {
      this.last = performance.now()
      const loop = (t: number) => {
        requestAnimationFrame(loop)
        const dt = t - this.last; this.last = t
        if (!this.running) { this.drawPause(); return }
        if (this.over) { this.drawOver(); return }
        this.update(dt); this.draw()
      }
      requestAnimationFrame(loop)
    })
  }

  private resize() {
    const c = this.canvasRef.nativeElement
    c.width = this.W * this.dpr
    c.height = this.H * this.dpr
    c.style.width = this.W + 'px'
    c.style.height = this.H + 'px'
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
  }

  private overlap(a: Rect, b: Rect) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
  }

  private update(dt: number) {
    const left  = this.keys.has('ArrowLeft') || this.keys.has('a') || this.keys.has('A') || this.touchDir === -1
    const right = this.keys.has('ArrowRight')|| this.keys.has('d') || this.keys.has('D') || this.touchDir === 1
    const speed = 0.35 * dt
    if (left) this.player.x -= speed
    if (right) this.player.x += speed
    this.player.x = Math.max(0, Math.min(this.W - this.player.w, this.player.x))

    this.spawnTimer += dt
    if (this.spawnTimer >= this.spawnEvery) {
      this.spawnTimer = 0
      this.enemies.push({ x: Math.random() * (this.W - 30), y: -30, w: 30, h: 30 })
      if (this.spawnEvery > 300) this.spawnEvery -= 15
    }

    const fall = Math.min(0.12 * dt, 12)
    for (const e of this.enemies) e.y += fall

    for (const e of this.enemies) {
      if (this.overlap(this.player, e)) {
        this.over = true
        this.hi = Math.max(this.hi, Math.floor(this.score))
        localStorage.setItem('hi', String(this.hi))
        break
      }
    }
    this.enemies = this.enemies.filter(e => e.y < this.H + 40)
    this.score += dt / 1000
  }

  private clear() { this.ctx.fillStyle = '#0b0f1a'; this.ctx.fillRect(0, 0, this.W, this.H) }

  private draw() {
    this.clear()
    this.ctx.fillStyle = '#5eead4'
    this.ctx.fillRect(this.player.x, this.player.y, this.player.w, this.player.h)

    this.ctx.fillStyle = '#f43f5e'
    for (const e of this.enemies) this.ctx.fillRect(e.x, e.y, e.w, e.h)

    this.ctx.fillStyle = '#e2e8f0'
    this.ctx.font = '14px ui-monospace, Menlo, monospace'
    this.ctx.fillText(`Score: ${Math.floor(this.score)}`, 12, 20)
    this.ctx.fillText(`Best: ${this.hi}`, 12, 38)
    this.ctx.fillText(`R = restart, P = pause`, 12, 56)
  }

  private drawPause() {
    this.draw()
    this.ctx.fillStyle = 'rgba(0,0,0,.4)'
    this.ctx.fillRect(0, 0, this.W, this.H)
    this.ctx.fillStyle = '#fff'
    this.ctx.font = '24px system-ui'
    this.ctx.fillText('PAUSED', this.W/2 - 50, this.H/2)
  }

  private drawOver() {
    this.draw()
    this.ctx.fillStyle = 'rgba(0,0,0,.5)'
    this.ctx.fillRect(0, 0, this.W, this.H)
    this.ctx.fillStyle = '#fff'
    this.ctx.font = '24px system-ui'
    this.ctx.fillText('GAME OVER — press R', this.W/2 - 140, this.H/2)
  }

  restart() {
    this.over = false
       this.score = 0
    this.enemies = []
    this.spawnEvery = 900
    this.player.x = (this.W - this.player.w) / 2
  }
}
