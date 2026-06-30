import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { BookmarksComponent } from './bookmarks.component';

describe('BookmarksComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [BookmarksComponent],
    providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
  }));
  it('should create', () => expect(TestBed.createComponent(BookmarksComponent).componentInstance).toBeTruthy());
});
