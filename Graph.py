import urllib.request as u
import urllib.error as err
from urllib import parse
import json
from config import get_config

config_obj = get_config()

# Sets the mysql password for the debug and release builds
version = config_obj["version"]
host = config_obj[version]["host"]
dbpass = config_obj[version]["dbpass"]


def get_ad_groups():
    try:
        request_url = u.urlopen(host + "/getAllADGroups")
    except err.URLError as e:
        return []

    data = json.loads(request_url.read())
    return data


def get_ad_group_members(group_name):
    try:
        request_url = u.urlopen(host + "/getGroupMembers/" + parse.quote(group_name))
    except err.URLError as e:
        return []

    data = json.loads(request_url.read())
    return data


class Graph:
    def __init__(self) -> None:
        self.adjacency_list = {}
        self.max_nesting = 0
        self.total_nesting = 0
        self.loaded = False

    def get_max_and_total_nesting(self):
        max_nesting = 0
        total_nesting = 0

        if self.loaded == False:
            self.build_adjacency_list()

        for node in self.adjacency_list:
            nesting = self.get_nesting(node)
            total_nesting = total_nesting + nesting
            if nesting > max_nesting:
                max_nesting = nesting
        self.max_nesting = max_nesting
        self.total_nesting = total_nesting

        return (max_nesting, total_nesting)

    def get_nesting(self, node):
        visited = {}
        nesting = 0
        queue = []
        if node in self.adjacency_list:
            queue.append({"node": node, "nesting": 0})
        while len(queue) > 0:
            curr = queue.pop(0)
            visited[curr["node"]] = 1
            if curr["nesting"] > nesting:
                nesting = curr["nesting"]

            if curr["node"] in self.adjacency_list:
                for vertex in self.adjacency_list:
                    if vertex not in visited:
                        queue.append({"node": vertex, "nesting": curr["nesting"] + 1})

        return nesting

    def build_adjacency_list(self):
        adj_list = {}
        visited = {}

        vertices = get_ad_groups()
        queue = []
        if len(vertices) > 0:
            queue = list(map(lambda a: a["Name"], vertices))

        while len(queue) > 0:
            curr = queue.pop(0)
            visited[curr] = 1

            adj_vertices = get_ad_group_members(curr)
            if len(adj_vertices) > 0:
                adj_list[curr] = list(map(lambda a: a["name"], adj_vertices))
            else:
                adj_list[curr] = []
            if len(adj_vertices) > 0:
                for vertex in adj_vertices:
                    if (
                        vertex["name"] not in visited
                        and vertex["objectClass"] == "group"
                    ):
                        queue.append(vertex["name"])

        nodes_with_members = {}
        for key in adj_list:
            if len(adj_list[key]) > 0:
                nodes_with_members[key] = adj_list[key]

        self.adjacency_list = nodes_with_members
        self.loaded = True

        return nodes_with_members
