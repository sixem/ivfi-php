/**
 * Copies a text to the clipboard
 */
export const clipboardCopy = async (text: string): Promise<boolean> =>
{
	if(navigator.clipboard)
	{
		try
		{
			await navigator.clipboard.writeText(text);
			return true;
		} catch {
			return false;
		}
	}

	/* Clipboard fallback for insecure contexts */
	const previous = document.activeElement;
	const textArea = document.createElement('textarea');
	textArea.value = text;
	textArea.readOnly = true;
	textArea.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
	document.body.append(textArea);
	try
	{
		textArea.focus({ preventScroll: true });
		textArea.select();
		return document.execCommand('copy');
	} catch {
		return false;
	} finally {
		textArea.remove();
		if(previous instanceof HTMLElement && previous.isConnected) previous.focus({ preventScroll: true });
	}
};
