import { Component, computed, model } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { MatSliderModule } from '@angular/material/slider'
import { MatInputModule } from '@angular/material/input'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { ClipboardModule } from '@angular/cdk/clipboard'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    FormsModule,
    MatSliderModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    ClipboardModule,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  // Inputs usando a API model() do Angular 21 (0 a 15)
  ataque = model(15)
  defesa = model(15)
  ps = model(15)

  // Cálculo reativo: Math.round(((ataque+defesa+ps)/45)*100)
  ivResultado = computed(() => {
    const soma = this.ataque() + this.defesa() + this.ps()
    return Math.round((soma / 45) * 100)
  })
}
