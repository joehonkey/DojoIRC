package cache

import (
	"container/list"
	"sync"
	"time"
)

type entry[V any] struct {
	key     string
	value   V
	expires time.Time
}

// LRU is a thread-safe LRU cache with per-entry TTL.
// Expired entries are evicted on access; LRU entries are evicted when the cache is full.
type LRU[V any] struct {
	mu    sync.Mutex
	max   int
	ttl   time.Duration
	ll    *list.List
	items map[string]*list.Element
}

// New returns an LRU cache holding at most max entries, each valid for ttl.
func New[V any](max int, ttl time.Duration) *LRU[V] {
	return &LRU[V]{
		max:   max,
		ttl:   ttl,
		ll:    list.New(),
		items: make(map[string]*list.Element, max),
	}
}

// Get returns the cached value for key and whether it was found and still valid.
func (c *LRU[V]) Get(key string) (V, bool) {
	c.mu.Lock()
	defer c.mu.Unlock()
	el, ok := c.items[key]
	if !ok {
		var zero V
		return zero, false
	}
	e := el.Value.(*entry[V])
	if time.Now().After(e.expires) {
		c.ll.Remove(el)
		delete(c.items, key)
		var zero V
		return zero, false
	}
	c.ll.MoveToFront(el)
	return e.value, true
}

// Set stores value under key, evicting the least-recently-used entry if the cache is full.
func (c *LRU[V]) Set(key string, value V) {
	c.mu.Lock()
	defer c.mu.Unlock()
	if el, ok := c.items[key]; ok {
		c.ll.MoveToFront(el)
		e := el.Value.(*entry[V])
		e.value = value
		e.expires = time.Now().Add(c.ttl)
		return
	}
	if c.ll.Len() >= c.max {
		back := c.ll.Back()
		if back != nil {
			delete(c.items, back.Value.(*entry[V]).key)
			c.ll.Remove(back)
		}
	}
	e := &entry[V]{key: key, value: value, expires: time.Now().Add(c.ttl)}
	c.items[key] = c.ll.PushFront(e)
}
