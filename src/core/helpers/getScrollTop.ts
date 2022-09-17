/**
 * Get window `scrollTop`
 */
export const getScrollTop = (): number =>
{
	return window.pageYOffset
		|| document.documentElement.scrollTop
		|| document.body.scrollTop || 0;
};