import { HttpInterceptorFn } from '@angular/common/http';

export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
  const csrfToken = localStorage.getItem('csrf_token') || '';
  if (csrfToken && !req.method.match(/^(GET|HEAD|OPTIONS)$/)) {
    const cloned = req.clone({
      setHeaders: { 'X-CSRF-Token': csrfToken },
    });
    return next(cloned);
  }
  return next(req);
};
