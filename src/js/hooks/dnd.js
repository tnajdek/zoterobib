import { useCallback } from 'react';
import { noop } from '../utils';

const marginVec2 = { x: -5, y: -5 };
var draggedItem = null;
var touchID = null;
const cleanupNodes = new Set();

const getClientVec2 = (ev, touch = null) => {
	return {
		x: ev.type.startsWith('touch') ? (touch ? touch.clientX : ev.changedTouches[0].clientX) : ev.clientX,
		y: ev.type.startsWith('touch') ? (touch ? touch.clientY : ev.changedTouches[0].clientY) : ev.clientY
	}
};

const markAboveOrBelow = (targetEl, clientVec2, midpointOffset) => {
	const rect = targetEl.getBoundingClientRect();
	const top = rect.y;
	targetEl.classList.toggle('dnd-target-above', clientVec2.y - top <= (rect.height * 0.5 + midpointOffset))
	targetEl.classList.toggle('dnd-target-below', clientVec2.y - top > (rect.height * 0.5 + midpointOffset))
};

const alwaysTrue = () => true;

const useDnd = ({ type, data, ref, onPickup = noop, onVerify = alwaysTrue, onComplete = noop, onCleanup = noop, midpointOffset = 0, ghostContainerSelector = 'body' }) => {
	if (!type) {
		throw new Error(`Named argument "type" is required for "onDrag'. Got ${type}`);
	}

	const onDrag = useCallback(ev => {
		const ghostContainer = document.querySelector(ghostContainerSelector);
		const ghost = ref.current.cloneNode(true);
		const rect = ref.current.getBoundingClientRect();
		const clientVec2 = getClientVec2(ev);
		const posVec2 = { x: rect.x + window.scrollX, y: rect.y + window.scrollY };
		const offsetVec2 = { x: posVec2.x - clientVec2.x + marginVec2.x, y: posVec2.y - clientVec2.y + marginVec2.y };
		const body = document.querySelector('body');

		if(draggedItem !== null) {
			return;
		}

		if(ev.type === 'touchstart') {
			touchID = ev.changedTouches[0].identifier;
		}

		ev.preventDefault();

		body.classList.add('dnd-in-progress');
		body.style.setProperty('--dnd-height', `${rect.height}px`);

		ref.current.classList.add('dnd-src');
		ghost.classList.add('dnd-ghost');
		ghost.style.position = 'absolute'
		ghost.style.top = `0`;
		ghost.style.left = `0`;
		ghost.style.transform = `translate(${clientVec2.x + offsetVec2.x}px, ${clientVec2.y + offsetVec2.y}px`;
		ghost.style.width = `${rect.width}px`;
		ghost.style.height = `${rect.height}px`;
		ghost.style.pointerEvents = 'none';

		ghostContainer.appendChild(ghost);

		draggedItem = { type, ...(typeof data === 'function' ? data(ev) : data) };

		onPickup(ev);

		const handleTouchMove = tmev => {
			const touch = Array.from(tmev.changedTouches).find(t => t.identifier === touchID);
			if (!touch) {
				return;
			}
			tmev.preventDefault();
			tmev.stopPropagation();

			const clientVec2 = getClientVec2(tmev, touch);
			ghost.style.transform = `translate(${clientVec2.x + offsetVec2.x}px, ${clientVec2.y + offsetVec2.y}px`;

			const dndCandidate = document
				.elementFromPoint(clientVec2.x, clientVec2.y)
				?.closest('[data-dnd-candidate]');

			if (dndCandidate) {
				for (const node of cleanupNodes) {
					if (node !== dndCandidate) {
						node.classList.remove('dnd-target-below', 'dnd-target-above', 'dnd-target');
					}
				}

				dndCandidate.classList.add('dnd-target');
				markAboveOrBelow(dndCandidate, clientVec2, midpointOffset);
				cleanupNodes.add(dndCandidate);
			}
		}

		const handleMouseMove = mmev => {
			const clientVec2 = getClientVec2(mmev);
			ghost.style.transform = `translate(${clientVec2.x + offsetVec2.x}px, ${clientVec2.y + offsetVec2.y}px`;
		};

		const cleanup = cleanupEv => {
			if(cleanupEv.type === 'touchend' || cleanupEv.type === 'touchcancel') {
				const touch = Array.from(cleanupEv.changedTouches).find(t => t.identifier === touchID);
				if (!touch) {
					return;
				}
				const clientVec2 = getClientVec2(cleanupEv, touch);
				const dndCandidate = document
					.elementFromPoint(clientVec2.x, clientVec2.y)
					?.closest('[data-dnd-candidate]');

				if (dndCandidate) {
					const rect = dndCandidate.getBoundingClientRect();
					const top = rect.y;
					const above = clientVec2.y - top <= rect.height * 0.5 + midpointOffset;

					onComplete(dndCandidate, above, draggedItem, ev);
				}
				touchID = null;
			}

			setTimeout(() => {
				ref.current.classList.remove('dnd-src');
				document.querySelector('body').classList.remove('dnd-in-progress');
				try {
					ghostContainer.removeChild(ghost);
					for (const node of cleanupNodes) {
						node.classList.remove('dnd-target-below', 'dnd-target-above', 'dnd-target');
					}

					cleanupNodes.clear();
					onCleanup(cleanupEv, draggedItem);
				} catch(e) {
					//
				}

				ghostContainer.removeEventListener('mousemove', handleMouseMove);
				ghostContainer.removeEventListener('touchmove', handleTouchMove);
				ghostContainer.removeEventListener('mouseup', cleanup);
				ghostContainer.removeEventListener('touchend', cleanup);
				ghostContainer.removeEventListener('touchcancel', cleanup);
				ghostContainer.removeEventListener('mouseleave', cleanup);
				document.querySelector('html').removeEventListener('mouseleave', cleanup);
				draggedItem = null;
			}, 0);
		};

		ghostContainer.addEventListener('mousemove', handleMouseMove, { passive: true, capture: false });
		ghostContainer.addEventListener('touchmove', handleTouchMove, { passive: false, capture: true });
		ghostContainer.addEventListener('mouseup', cleanup, { passive: true, capture: false });
		ghostContainer.addEventListener('touchend', cleanup, { passive: true, capture: false });
		ghostContainer.addEventListener('touchcancel', cleanup, { passive: true, capture: false });
		document.querySelector('html').addEventListener('mouseleave', cleanup, false);
	}, [data, ghostContainerSelector, midpointOffset, onCleanup, onComplete, onPickup, ref, type]);

	const onHover = useCallback(ev => {
		if (draggedItem?.type !== type) {
			return;
		}
		const acceptTarget = onVerify(ev, draggedItem);
		if (!acceptTarget) {
			return;
		}

		if (ev.type === 'mouseover' || ev.type === 'mousemove') {
			markAboveOrBelow(ev.currentTarget, getClientVec2(ev), midpointOffset);
		}
		if (ev.type === 'mouseout') {
			if (ev.relatedTarget === ev.currentTarget || ev.currentTarget.contains(ev.relatedTarget)) {
				return;
			}

			ev.currentTarget.classList.remove('dnd-target-below', 'dnd-target-above', 'dnd-target');
			ev.stopPropagation();
		}
		if (ev.type === 'mouseover') {
			ev.currentTarget.classList.add('dnd-target');
			cleanupNodes.add(ev.currentTarget);
			ev.stopPropagation();
		}
	}, [midpointOffset, onVerify, type]);

	const onDrop = useCallback(ev => {
		if (draggedItem?.type === type) {
			ev.currentTarget.classList.remove('dnd-target-below', 'dnd-target-above', 'dnd-target');
			const rect = ev.currentTarget.getBoundingClientRect();
			const top = rect.y;
			const above = ev.clientY - top <= rect.height * 0.5 + midpointOffset;
			onComplete(ev.currentTarget, above, draggedItem, ev);
		}
	}, [midpointOffset, onComplete, type]);

	return { onDrag, onHover, onDrop };
}

export { useDnd };