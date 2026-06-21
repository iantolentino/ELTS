<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class TicketTag extends Model
{
    protected $fillable = ['name', 'color'];

    public function tickets(): BelongsToMany
    {
        return $this->belongsToMany(Ticket::class, 'ticket_tag_pivot', 'tag_id', 'ticket_id');
    }
}
