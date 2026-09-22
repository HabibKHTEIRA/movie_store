import { Routes } from '@angular/router';
import { MovieListComponent } from './components/movie-list/movie-list.component';
import { MovieDetailComponent } from './components/movie-detail/movie-detail.component';
import { MyPurchasesComponent } from './components/my-purchases/my-purchases.component';
import { AdminComponent } from './components/admin/admin.component';

export const routes: Routes = [
  { path: '', component: MovieListComponent },
  { path: 'movie/:id', component: MovieDetailComponent },
  { path: 'my-purchases', component: MyPurchasesComponent },
  { path: 'admin', component: AdminComponent },
  { path: '**', redirectTo: '' }
];
