import { downloadFile, FileDownload } from '../../modules/file-actions';

export function getRowFile(row: HTMLElement): FileDownload | null
{
	if(!row.classList.contains('file')) return null;
	const link = row.querySelector<HTMLAnchorElement>('td:first-child > a');
	if(!link) return null;
	return { name: row.firstElementChild.getAttribute('data-raw') || link.textContent, url: link.href };
}

export function downloadRow(row: HTMLElement): void
{
	const file = getRowFile(row);
	if(file) downloadFile(file.url, file.name);
}
