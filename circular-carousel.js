/**
 * Circular Carousel - Vanilla JS implementation of React Bits 3D Circular Carousel
 * Features:
 * - 3D Cylindrical ring of bendable curved cards
 * - Smooth continuous drift autoplay
 * - Momentum drag & touch inertia
 * - Angle snapping to nearest card
 * - Mouse parallax tilt effect
 * - Responsive auto-scaling
 * - Active card change callback
 */

(function (window) {
  'use strict';

  const TILES = 8;
  const OVERLAP = 2.5;
  const DRAG_THRESHOLD = 5;
  const SPRING = 118;
  const SETTLE_SPEED = 9;
  const TO_RAD = Math.PI / 180;

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const wrap = degrees => ((((degrees + 180) % 360) + 360) % 360) - 180;
  const easeOut = t => 1 - Math.pow(1 - t, 4);

  const rotateX = (p, degrees) => {
    const r = degrees * TO_RAD;
    const c = Math.cos(r);
    const s = Math.sin(r);
    return [p[0], p[1] * c - p[2] * s, p[1] * s + p[2] * c];
  };

  const rotateY = (p, degrees) => {
    const r = degrees * TO_RAD;
    const c = Math.cos(r);
    const s = Math.sin(r);
    return [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c];
  };

  class CircularCarousel {
    constructor(container, options = {}) {
      this.container = typeof container === 'string' ? document.querySelector(container) : container;
      if (!this.container) return;

      this.options = Object.assign({
        items: [],
        cardWidth: 320,
        aspectRatio: 1.35,
        gap: 30,
        tilt: -5,
        perspective: 2500,
        speed: 12,
        direction: 'left',
        draggable: true,
        momentum: 0.6,
        snap: true,
        pauseOnHover: true,
        focusOnClick: true,
        parallax: 0.25,
        depthFade: 0.6,
        fadeColor: '#0b2239',
        innerShade: 0.5,
        cornerRadius: 14,
        onChange: null,
        onItemClick: null
      }, options);

      this.rawItems = [...this.options.items];
      this.items = this.normalizeItems(this.rawItems);
      this.active = 0;
      this.ready = false;
      this.dragging = false;

      this.state = {
        angle: 0,
        velocity: 0,
        target: null,
        dir: this.options.direction === 'right' ? 1 : -1,
        press: null,
        drag: false,
        hover: false,
        pointer: { inside: false, x: 0, y: 0 },
        yaw: 0,
        pitch: 0,
        holdUntil: 0,
        suppressClick: false,
        fit: 1,
        shift: 0,
        last: 0
      };

      this.cardRefs = [];
      this.raf = null;
      this.visible = true;

      this.initDOM();
      this.calculateDimensions();
      this.buildTiles();
      this.renderCards();
      this.attachEvents();
      this.measure();
      this.ready = true;
      this.root.setAttribute('data-ready', '');
      this.wake();
    }

    normalizeItems(rawItems) {
      if (!rawItems || !rawItems.length) return [];
      let list = [...rawItems];
      // Çember silindirinin dengeli dönmesi için minimum 4 eleman olmasını sağlıyoruz
      if (list.length === 1) {
        list = [list[0], { ...list[0], _duplicate: true }, { ...list[0], _duplicate: true }, { ...list[0], _duplicate: true }];
      } else if (list.length === 2) {
        list = [list[0], list[1], { ...list[0], _duplicate: true }, { ...list[1], _duplicate: true }];
      } else if (list.length === 3) {
        list = [...list, ...list.map(i => ({ ...i, _duplicate: true }))];
      }
      return list;
    }
      this.container.innerHTML = '';
      this.root = document.createElement('div');
      this.root.className = 'circular-carousel';
      this.root.style.setProperty('--cc-fade', this.options.fadeColor);
      this.root.style.setProperty('--cc-radius', `${this.options.cornerRadius}px`);
      this.root.style.setProperty('--cc-inner', (1 - clamp(this.options.innerShade, 0, 1)).toFixed(3));
      if (this.options.draggable) {
        this.root.setAttribute('data-draggable', '');
      }

      this.view = document.createElement('div');
      this.view.className = 'circular-carousel__view';

      this.stage = document.createElement('div');
      this.stage.className = 'circular-carousel__stage';

      this.camera = document.createElement('div');
      this.camera.className = 'circular-carousel__camera';

      this.ring = document.createElement('div');
      this.ring.className = 'circular-carousel__ring';

      this.camera.appendChild(this.ring);
      this.stage.appendChild(this.camera);
      this.view.appendChild(this.stage);
      this.root.appendChild(this.view);
      this.container.appendChild(this.root);
    }

    get originalCount() {
      return this.rawItems ? this.rawItems.length : this.items.length;
    }

    calculateDimensions() {
      const isMobile = window.innerWidth <= 640;
      const isTablet = window.innerWidth <= 960;
      let baseWidth = this.options.cardWidth;

      if (isMobile) {
        baseWidth = Math.min(260, window.innerWidth - 60);
      } else if (isTablet) {
        baseWidth = 280;
      }

      this.cardW = Math.max(40, baseWidth);
      this.cardH = this.cardW / clamp(this.options.aspectRatio, 0.2, 5);
      this.along = this.cardW;
      this.count = Math.max(this.items.length, 3);
      this.step = 360 / this.count;

      const pitch = (this.along + this.options.gap);
      const chord = pitch / (2 * Math.sin(Math.PI / this.count));
      const arc = (this.count * pitch) / (2 * Math.PI);
      this.radius = Math.max(chord + (arc - chord), this.along * 0.7);
    }

    buildTiles() {
      const total = TILES;
      const length = this.along / total;
      const bend = this.radius;

      this.tiles = Array.from({ length: total }, (_, index) => {
        const start = index * length - (index > 0 ? OVERLAP / 2 : 0);
        const end = (index + 1) * length + (index < total - 1 ? OVERLAP / 2 : 0);
        const center = (start + end) / 2 - this.along / 2;
        const alpha = bend ? center / bend : 0;
        const shift = bend ? bend * Math.sin(alpha) : center;
        const sink = bend ? bend * (1 - Math.cos(alpha)) : 0;
        const depth = -sink;
        const turn = (alpha * 180) / Math.PI;
        const move = `translate3d(${shift}px, 0px, ${depth}px) rotateY(${turn}deg)`;
        return { index, total, start, end, size: end - start, move };
      });
    }

    createTileElement(item, tile, back) {
      const strip = back ? tile.total - 1 - tile.index : tile.index;
      const first = strip === 0;
      const last = strip === tile.total - 1;
      const r = 'var(--cc-radius)';
      const frameRadius = `${first ? r : 0} ${last ? r : 0} ${last ? r : 0} ${first ? r : 0}`;
      const offset = back ? this.along - tile.end : tile.start;
      const size = tile.size;

      const tileDiv = document.createElement('div');
      tileDiv.className = 'circular-carousel__tile';
      tileDiv.style.left = `${-size / 2}px`;
      tileDiv.style.top = `${-this.cardH / 2}px`;
      tileDiv.style.width = `${size}px`;
      tileDiv.style.height = `${this.cardH}px`;
      tileDiv.style.transform = tile.move + (back ? ' rotateY(180deg)' : '');
      tileDiv.setAttribute('aria-hidden', 'true');

      const frame = document.createElement('div');
      frame.className = 'circular-carousel__frame';
      frame.style.height = `${this.cardH}px`;
      frame.style.borderRadius = frameRadius;

      const img = document.createElement('img');
      img.className = 'circular-carousel__photo';
      img.src = item.image || item.src;
      img.alt = item.title || '';
      img.draggable = false;
      img.loading = 'lazy';
      img.style.left = `${-offset}px`;
      img.style.top = '0px';
      img.style.width = `${this.cardW}px`;
      img.style.height = `${this.cardH}px`;
      frame.appendChild(img);

      // Kartın üstüne web bar (browser simülasyonu)
      if (item.url && !back) {
        const bar = document.createElement('div');
        bar.className = 'circular-carousel__bar';
        bar.innerHTML = `
          <div class="circular-carousel__bar-dot" style="background:#ff5f56"></div>
          <div class="circular-carousel__bar-dot" style="background:#ffbd2e"></div>
          <div class="circular-carousel__bar-dot" style="background:#27c93f"></div>
          <span class="circular-carousel__bar-url">${item.url.replace(/^https?:\/\//, '')}</span>
        `;
        frame.appendChild(bar);
      }

      if (back) {
        const inner = document.createElement('div');
        inner.className = 'circular-carousel__inner';
        frame.appendChild(inner);
      }

      const shade = document.createElement('div');
      shade.className = 'circular-carousel__shade';
      frame.appendChild(shade);

      tileDiv.appendChild(frame);
      return tileDiv;
    }

    renderCards() {
      this.ring.innerHTML = '';
      this.cardRefs = [];

      this.items.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'circular-carousel__card';
        card.setAttribute('data-cc-index', index);
        card.setAttribute('role', 'group');
        card.setAttribute('aria-label', item.title || `Proje ${index + 1}`);

        // Ön yüz dilimleri
        this.tiles.forEach(tile => {
          card.appendChild(this.createTileElement(item, tile, false));
        });

        // Arka yüz dilimleri (silindirik derinlik etkisi)
        this.tiles.forEach(tile => {
          card.appendChild(this.createTileElement(item, tile, true));
        });

        this.ring.appendChild(card);
        this.cardRefs.push(card);
      });
    }

    measure() {
      if (!this.root || !this.stage) return;
      const rect = this.root.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const width = rect.width * 0.95;
      const height = rect.height * 0.92;
      const P = this.options.perspective;

      const corners = [
        [-this.cardW / 2, -this.cardH / 2],
        [this.cardW / 2, -this.cardH / 2],
        [-this.cardW / 2, this.cardH / 2],
        [this.cardW / 2, this.cardH / 2]
      ];

      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;

      for (let a = -180; a <= 180; a += 10) {
        for (const [cx, cy] of corners) {
          let p = rotateX(rotateY([cx, cy, this.radius], a), this.options.tilt);
          p = [p[0], p[1], p[2] - this.radius];
          if (p[2] >= P * 0.95) continue;
          const k = P / (P - p[2]);
          minX = Math.min(minX, p[0] * k);
          maxX = Math.max(maxX, p[0] * k);
          minY = Math.min(minY, p[1] * k);
          maxY = Math.max(maxY, p[1] * k);
        }
      }

      const spanX = Math.max(maxX - minX, 1);
      const spanY = Math.max(maxY - minY, 1);
      const fit = Math.min(1, width / spanX, height / spanY);

      this.state.fit = fit;
      this.state.shift = -((minY + maxY) / 2) * fit;

      this.stage.style.perspective = `${P}px`;
      this.stage.style.transform = `translate3d(0, ${this.state.shift}px, 0) scale(${fit})`;
    }

    nearest(angle) {
      return Math.round(angle / this.step) * this.step;
    }

    advance(dt, now) {
      const s = this.options;
      const state = this.state;
      const paused = (s.pauseOnHover && state.hover) || state.drag || now < state.holdUntil;
      const cruise = !paused ? s.speed * state.dir : 0;
      let busy = state.drag;

      if (state.drag) {
        state.velocity = state.velocity;
      } else if (state.target !== null) {
        let remaining = dt;
        const damping = 2 * Math.sqrt(SPRING);
        while (remaining > 0) {
          const h = Math.min(remaining, 1 / 240);
          const accel = SPRING * (state.target - state.angle) - damping * state.velocity;
          state.velocity += accel * h;
          state.angle += state.velocity * h;
          remaining -= h;
        }
        if (Math.abs(state.target - state.angle) < 0.005 && Math.abs(state.velocity) < 0.04) {
          state.angle = state.target;
          state.velocity = 0;
          state.target = null;
        }
        busy = true;
      } else {
        const tau = 0.18 + s.momentum * 1.5;
        state.velocity += (cruise - state.velocity) * (1 - Math.exp(-dt / tau));
        state.angle += state.velocity * dt;

        if (cruise === 0 && s.snap && Math.abs(state.velocity) < SETTLE_SPEED) {
          state.target = this.nearest(state.angle);
        }
        busy = busy || cruise !== 0 || Math.abs(state.velocity) > 0.01 || state.target !== null;
      }

      if (now < state.holdUntil) busy = true;

      const ease = 1 - Math.exp(-dt / 0.35);
      const aimYaw = state.pointer.inside ? state.pointer.x * s.parallax * 9 : 0;
      const aimPitch = state.pointer.inside ? -state.pointer.y * s.parallax * 6 : 0;
      state.yaw += (aimYaw - state.yaw) * ease;
      state.pitch += (aimPitch - state.pitch) * ease;

      if (Math.abs(aimYaw - state.yaw) > 0.01 || Math.abs(aimPitch - state.pitch) > 0.01) busy = true;

      return busy;
    }

    render(now) {
      const s = this.options;
      const state = this.state;
      const angle = state.angle;
      const R = this.radius;

      this.camera.style.transform = `translate3d(0, 0, ${-R}px) rotateX(${s.tilt + state.pitch}deg) rotateY(${state.yaw}deg)`;
      this.ring.style.transform = `rotateY(${angle}deg)`;

      for (let index = 0; index < this.count; index++) {
        const card = this.cardRefs[index];
        if (!card) continue;
        const base = index * this.step;
        card.style.transform = `rotateY(${base}deg) translateZ(${R}px)`;

        const world = wrap(base + angle);
        const facing = Math.cos(world * TO_RAD);
        const fade = s.depthFade * Math.pow((1 - facing) / 2, 1.25);
        card.style.setProperty('--cc-depth', fade.toFixed(3));
      }

      const activeIdx = ((Math.round(-state.angle / this.step) % this.count) + this.count) % this.count || 0;
      if (activeIdx !== this.active) {
        this.active = activeIdx;
        if (typeof s.onChange === 'function') {
          s.onChange(activeIdx, this.items[activeIdx]);
        }
      }
    }

    frame(now) {
      this.raf = null;
      const dt = this.state.last ? Math.min((now - this.state.last) / 1000, 0.05) : 1 / 60;
      this.state.last = now;
      const busy = this.advance(dt, now);
      this.render(now);

      if (busy && this.visible && !document.hidden) {
        this.raf = requestAnimationFrame(this.frame.bind(this));
      } else {
        this.state.last = 0;
      }
    }

    wake() {
      if (!this.raf && this.visible && !document.hidden) {
        this.raf = requestAnimationFrame(this.frame.bind(this));
      }
    }

    focusIndex(index) {
      const state = this.state;
      let target = -index * this.step;
      target += 360 * Math.round((state.angle - target) / 360);
      state.target = target;
      state.holdUntil = performance.now() + 3000;
      this.wake();
    }

    next() {
      const base = this.state.target ?? Math.round(this.state.angle / this.step) * this.step;
      this.state.target = base - this.step;
      this.state.holdUntil = performance.now() + 2500;
      this.wake();
    }

    prev() {
      const base = this.state.target ?? Math.round(this.state.angle / this.step) * this.step;
      this.state.target = base + this.step;
      this.state.holdUntil = performance.now() + 2500;
      this.wake();
    }

    setItems(newItems) {
      if (!newItems || !newItems.length) return;
      this.rawItems = [...newItems];
      this.items = this.normalizeItems(this.rawItems);
      this.active = 0;
      this.state.angle = 0;
      this.state.target = null;
      this.state.velocity = 0;
      this.calculateDimensions();
      this.buildTiles();
      this.renderCards();
      this.measure();
      if (typeof this.options.onChange === 'function') {
        this.options.onChange(0, this.items[0]);
      }
      this.wake();
    }

    attachEvents() {
      const root = this.root;
      const state = this.state;

      const onPointerDown = e => {
        state.suppressClick = false;
        if (!this.options.draggable || e.button !== 0) return;
        state.press = {
          id: e.pointerId,
          x: e.clientX,
          y: e.clientY,
          angle: state.angle,
          moved: false,
          origin: 0,
          samples: [{ time: performance.now(), angle: state.angle }]
        };
      };

      const onPointerMove = e => {
        if (e.pointerType === 'mouse') {
          state.pointer.inside = true;
          const rect = root.getBoundingClientRect();
          state.pointer.x = clamp(((e.clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
          state.pointer.y = clamp(((e.clientY - rect.top) / rect.height) * 2 - 1, -1, 1);
        }

        const press = state.press;
        if (!press || press.id !== e.pointerId) {
          this.wake();
          return;
        }

        const delta = e.clientX - press.x;
        const cross = e.clientY - press.y;

        if (!press.moved) {
          if (Math.abs(delta) < DRAG_THRESHOLD) return;
          if (Math.abs(cross) > Math.abs(delta) * 1.2 && e.pointerType !== 'mouse') {
            state.press = null;
            return;
          }
          press.moved = true;
          press.origin = delta;
          state.drag = true;
          state.target = null;
          state.velocity = 0;
          this.dragging = true;
          root.setAttribute('data-dragging', '');
          try { root.setPointerCapture(e.pointerId); } catch (_) {}
        }

        const perPixel = 180 / (Math.PI * this.radius * state.fit);
        state.angle = press.angle + (delta - press.origin) * perPixel;

        const now = performance.now();
        press.samples.push({ time: now, angle: state.angle });
        while (press.samples.length > 2 && now - press.samples[0].time > 110) {
          press.samples.shift();
        }
        this.wake();
      };

      const onPointerUp = e => {
        const press = state.press;
        if (!press || press.id !== e.pointerId) return;
        state.press = null;
        if (!press.moved) return;

        state.drag = false;
        this.dragging = false;
        root.removeAttribute('data-dragging');
        state.suppressClick = true;

        const first = press.samples[0];
        const last = press.samples[press.samples.length - 1];
        const span = (last.time - first.time) / 1000;
        const velocity = span > 0.008 ? clamp((last.angle - first.angle) / span, -1400, 1400) : 0;
        state.velocity = velocity;

        if (Math.abs(velocity) > 60) state.dir = Math.sign(velocity);

        if (this.options.snap) {
          const tau = 0.18 + this.options.momentum * 1.5;
          state.target = this.nearest(state.angle + velocity * tau * 0.55);
        }
        this.wake();
      };

      root.addEventListener('pointerdown', onPointerDown);
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);

      root.addEventListener('pointerenter', e => {
        if (e.pointerType !== 'mouse') return;
        state.hover = true;
        this.wake();
      });

      root.addEventListener('pointerleave', e => {
        if (e.pointerType === 'mouse') {
          state.hover = false;
          state.pointer.inside = false;
        }
        this.wake();
      });

      root.addEventListener('click', e => {
        if (state.suppressClick) {
          state.suppressClick = false;
          return;
        }
        const card = e.target.closest('[data-cc-index]');
        if (!card) return;
        const index = Number(card.getAttribute('data-cc-index'));
        if (this.options.focusOnClick) {
          this.focusIndex(index);
        }
        if (typeof this.options.onItemClick === 'function') {
          this.options.onItemClick(this.items[index], index);
        }
      });

      const onResize = () => {
        this.calculateDimensions();
        this.buildTiles();
        this.renderCards();
        this.measure();
        this.wake();
      };
      window.addEventListener('resize', onResize);

      const io = new IntersectionObserver(([entry]) => {
        this.visible = entry.isIntersecting;
        if (this.visible) this.wake();
      });
      io.observe(root);
    }
  }

  window.CircularCarousel = CircularCarousel;
})(window);
