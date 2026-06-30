import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [LoginComponent],
    providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
  }));

  it('should create', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show validation error on invalid email', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
    const emailCtrl = fixture.componentInstance.form.get('email')!;
    emailCtrl.setValue('not-an-email');
    emailCtrl.markAsTouched();
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.error')?.textContent).toContain('Email inválido');
  });
});
