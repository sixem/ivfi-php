/**
 * Copies a text to the clipboard
 */
export const clipboardCopy = (text: string): void =>
{
	if(!navigator.clipboard)
	{
		const textArea: HTMLTextAreaElement = document.createElement('textarea');
		textArea.value = text;
		
		textArea.style.top = '0';
		textArea.style.left = '0';
		textArea.style.position = 'fixed';

		document.body.appendChild(textArea);
		textArea.focus();
		textArea.select();

		try
		{
			const successful = document.execCommand('copy');

			console.log('clipboardCopy', {
				type: 'Fallback',
				successful: successful
			});
		} catch (err) {
			console.log('clipboardCopy', {
				type: 'Fallback',
				successful: false
			});
		}

		document.body.removeChild(textArea);

		return;
	}

	navigator.clipboard.writeText(text).then(() =>
	{
		console.log('clipboardCopy', {
			type: 'async',
			successful: true
		});
	}).catch(() =>
	{
		console.log('clipboardCopy', {
			type: 'async',
			successful: false
		});
	});
};