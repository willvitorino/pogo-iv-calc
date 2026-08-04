import { Component, computed, input, model, signal } from '@angular/core'

/**
 * Slider segmentado discreto (0..max) composto por micro-segmentos
 * quadrados, divididos em segments com espaçamento maior entre eles.
 *
 * Exemplo com 3 segments de 5: (1|2|3|4|5) (6|7|8|9|10) (11|12|13|14|15)
 * — 1px de espaçamento entre micro-segmentos, 5px entre segments.
 *
 * Cada micro-segmento emite o valor numérico que representa ao ser clicado.
 * Clicar no micro-segmento que é o último selecionado volta para o mínimo
 * (nada selecionado). Sem arraste: interação por clique + teclado.
 */
@Component({
  selector: 'app-segmented-slider-v2',
  standalone: true,
  templateUrl: './segmented-slider-v2.component.html',
  styleUrls: ['./segmented-slider-v2.component.scss'],
  host: {
    role: 'slider',
    tabindex: '0',
    '[attr.aria-label]': 'label()',
    '[attr.aria-valuemin]': 'min()',
    '[attr.aria-valuemax]': 'max()',
    '[attr.aria-valuenow]': 'value()',
    '(keydown)': 'onKeydown($event)',
  },
})
export class SegmentedSliderV2 {
  /** Texto exibido acima da barra (ex.: "Ataque"). */
  label = input('')
  /** Valor mínimo — também o estado "nada selecionado". */
  min = input(0)
  /** Valor máximo (deve ser igual a `segments * microsPerSegment`). */
  max = input(15)
  /** Quantidade de segments visuais. */
  segments = input(3)
  /** Quantidade de micro-segmentos por segment. */
  microsPerSegment = input(5)

  /** Valor de duas vias — use com [(value)]. */
  value = model(0)

  /** Valor emitido do micro-segmento sob o ponteiro, ou null fora da track. */
  protected readonly hover = signal<number | null>(null)

  /**
   * Micro-segmentos 1-based, já divididos em segments para o template.
   * Cada item expõe o valor emitido e os estados visual (cor, baseada em
   * seleção + hover, e arredondamentos esquerdo/direito).
   */
  protected readonly segmentsList = computed(() => {
    const min = this.min()
    const micros = this.microsPerSegment()
    const value = this.value()
    const hover = this.hover()
    const lastG = this.segments() - 1

    return Array.from({ length: this.segments() }, (_, g) =>
      Array.from({ length: micros }, (_, i) => {
        const emitValue = min + g * micros + i + 1
        const selected = emitValue <= value

        let state: 'active' | 'inactive' | 'hover'
        if (selected) {
          // Hover sobre selecionado: o hovered se mantém ativo e os
          // selecionados à direita dele ficam em hover.
          state =
            hover !== null && hover <= value && emitValue > hover
              ? 'hover'
              : 'active'
        } else if (hover !== null && hover > value && emitValue <= hover) {
          // Hover sobre não selecionado: o hovered e os não selecionados
          // à esquerda dele ficam em hover.
          state = 'hover'
        } else {
          // Não selecionados à direita do hovered permanecem inativos.
          state = 'inactive'
        }

        return {
          emitValue,
          state,
          // O 1º micro-segmento da track sempre arredonda à esquerda...
          roundLeft: g === 0 && i === 0,
          // ...e o último sempre à direita; os demais só quando são o
          // último selecionado ou o segmento sob o hover (fim da região).
          roundRight:
            (g === lastG && i === micros - 1) ||
            (emitValue === value && value !== min) ||
            emitValue === hover,
        }
      }),
    )
  })

  /** Pointer entrou em um micro-segmento. */
  protected onEnter(emitValue: number): void {
    this.hover.set(emitValue)
  }

  /** Pointer saiu da track. */
  protected onLeave(): void {
    this.hover.set(null)
  }

  /**
   * Pointer (toque/mouse/caneta) em um micro-segmento: emite seu valor;
   * se for o último selecionado, volta para o mínimo (deseleciona).
   */
  protected onSelect(emitValue: number): void {
    this.value.set(emitValue === this.value() ? this.min() : emitValue)
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
        next += this.microsPerSegment()
        break
      case 'PageDown':
        next -= this.microsPerSegment()
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
    this.value.set(Math.max(this.min(), Math.min(this.max(), next)))
  }
}
