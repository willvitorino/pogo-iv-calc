import {
  Component,
  ElementRef,
  HostListener,
  computed,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core'

/**
 * Slider segmentado e acessível (0..max) desenhado como barras grossas
 * divididas em N segmentos iguais, sem "thumb" visível.
 *
 * Cada segmento representa `max / segments` unidades. O preenchimento é
 * calculado por segmento, então com max=15 e segments=3 cada bloco vale 5.
 *
 * Interação via Pointer Events (mouse/toque/caneta) + teclado (role="slider").
 */
@Component({
  selector: 'app-segmented-slider',
  standalone: true,
  templateUrl: './segmented-slider.component.html',
  styleUrls: ['./segmented-slider.component.scss'],
  host: {
    role: 'slider',
    tabindex: '0',
    '[attr.aria-label]': 'label()',
    '[attr.aria-valuemin]': 'min()',
    '[attr.aria-valuemax]': 'max()',
    '[attr.aria-valuenow]': 'value()',
    '[class.dragging]': 'dragging()',
    '(keydown)': 'onKeydown($event)',
  },
})
export class SegmentedSlider {
  /** Texto exibido acima da barra (ex.: "Ataque"). */
  label = input('')
  /** Valor mínimo. */
  min = input(0)
  /** Valor máximo. */
  max = input(15)
  /** Quantidade de segmentos visuais. */
  segments = input(3)

  /** Valor de duas vias — use com [(value)]. */
  value = model(0)

  /** True enquanto o usuário arrasta — usado para desligar a transição. */
  protected dragging = signal(false)

  /** Referência ao elemento da trilha para medir a posição do ponteiro. */
  private readonly track =
    viewChild.required<ElementRef<HTMLElement>>('track')

  /** Tamanho de cada segmento em unidades (ex.: 15 / 3 = 5). */
  private readonly segmentSize = computed(
    () => (this.max() - this.min()) / this.segments(),
  )

  /**
   * Percentual de preenchimento [0..100] de cada segmento.
   * Um valor de 7 (segmentos de 5) gera: [100, 40, 0].
   */
  protected readonly segmentFills = computed(() => {
    const size = this.segmentSize()
    const filledUnits = this.value() - this.min()

    return Array.from({ length: this.segments() }, (_, i) => {
      const ratio = (filledUnits - i * size) / size
      return Math.max(0, Math.min(1, ratio)) * 100
    })
  })

  protected onPointerDown(event: PointerEvent): void {
    event.preventDefault()
    this.track().nativeElement.setPointerCapture(event.pointerId)
    this.dragging.set(true)
    this.updateFromPointer(event)
  }

  @HostListener('pointermove', ['$event'])
  protected onPointerMove(event: PointerEvent): void {
    if (!this.dragging()) return
    this.updateFromPointer(event)
  }

  @HostListener('pointerup', ['$event'])
  @HostListener('pointercancel', ['$event'])
  protected onPointerUp(event: PointerEvent): void {
    if (!this.dragging()) return
    this.dragging.set(false)
    this.track().nativeElement.releasePointerCapture(event.pointerId)
  }

  protected onKeydown(event: KeyboardEvent): void {
    let next = this.value()

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        next += 1
        break
      case 'ArrowLeft':
      case 'ArrowDown':
        next -= 1
        break
      case 'PageUp':
        next += this.segmentSize()
        break
      case 'PageDown':
        next -= this.segmentSize()
        break
      case 'Home':
        next = this.min()
        break
      case 'End':
        next = this.max()
        break
      default:
        return
    }

    event.preventDefault()
    this.commit(next)
  }

  /** Converte a posição X do ponteiro em um valor discreto e o aplica. */
  private updateFromPointer(event: PointerEvent): void {
    const rect = this.track().nativeElement.getBoundingClientRect()
    const ratio = (event.clientX - rect.left) / rect.width
    const raw = this.min() + ratio * (this.max() - this.min())
    this.commit(raw)
  }

  /** Arredonda, limita ao intervalo e só escreve se houver mudança. */
  private commit(raw: number): void {
    const clamped = Math.max(this.min(), Math.min(this.max(), Math.round(raw)))
    if (clamped !== this.value()) this.value.set(clamped)
  }
}
